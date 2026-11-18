// Eval runner for the expl1 stage skills 1-4.
//
//   npm run eval -- --skill <name|all> [--only c1,c2] [--runs 3] [--max-cost-usd N] [--timeout-min 20]
//                   [--update-baseline --reason "…" [--allow-decrease]] [--probe-leak]
//
// Exit codes: 0 no regression · 1 regression, not comparable, or baseline rule broken · 2 bad input / run incomplete.
// Workflow, rules and how to read the report: evals/README.md.
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { diffAgainst, casesHash, passThreshold, updateBaseline } from "./lib/baseline";
import { judgeWithGrader, judgeWithReviewer } from "./lib/llm-judge";
import { errorsOf, failureCounter, renderSkill, writeResults, type SkillReport } from "./lib/report";
import { probeLeak, resetSandboxRoot, runSkillTrial, SANDBOX_ROOT } from "./lib/run-skill";
import { addTokens, fmtTokens, noTokens } from "./lib/tokens";
import { EVALS_DIR, loadCases, loadCriteria, loadGrader, REVIEWER_CRITERIA, STAGES, stageOf } from "./lib/stages";
import type { Case, CaseResult, CheckCtx, CriterionResult, StageDef, Tokens, TrialResult } from "./lib/types";

interface Args {
  skill: string;
  only: string[] | null;
  runs: number;
  maxCost: number | null;
  timeoutMin: number;
  update: boolean;
  reason: string;
  allowDecrease: boolean;
  probeLeak: boolean;
}

const USAGE =
  'Usage: npm run eval -- --skill <name|all> [--only c1,c2] [--runs 3] [--max-cost-usd N] [--timeout-min 20] [--update-baseline --reason "…" [--allow-decrease]] [--probe-leak]';

function parseArgs(argv: string[]): Args {
  const a: Args = { skill: "", only: null, runs: 3, maxCost: null, timeoutMin: 20, update: false, reason: "", allowDecrease: false, probeLeak: false };
  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = argv[i]!.split("=", 2) as [string, string | undefined];
    const value = (): string => {
      const v = inline ?? argv[++i];
      if (v === undefined) throw new Error(`${flag} needs a value`);
      return v;
    };
    if (flag === "--skill") a.skill = value();
    else if (flag === "--only") a.only = value().split(",").map((s) => s.trim()).filter(Boolean);
    else if (flag === "--runs") a.runs = Number(value());
    else if (flag === "--max-cost-usd") a.maxCost = Number(value());
    else if (flag === "--timeout-min") a.timeoutMin = Number(value());
    else if (flag === "--update-baseline") a.update = true;
    else if (flag === "--reason") a.reason = value();
    else if (flag === "--allow-decrease") a.allowDecrease = true;
    else if (flag === "--probe-leak") a.probeLeak = true;
    else throw new Error(`Unknown option ${argv[i]}`);
  }
  if (!a.probeLeak && !a.skill) throw new Error("--skill is required");
  if (!Number.isInteger(a.runs) || a.runs < 1) throw new Error("--runs must be a positive integer");
  if (a.maxCost !== null && !(a.maxCost > 0)) throw new Error("--max-cost-usd must be a positive number");
  return a;
}

const stamp = (): string => new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);

function validateCaseCriteria(stage: StageDef, cases: Case[]): void {
  const det = new Set(loadCriteria(stage.skill).map((c) => c.id));
  const llm = new Set([...loadGrader(stage.skill).map((c) => c.id), ...Object.keys(REVIEWER_CRITERIA).filter((id) => id.startsWith(`s${stage.n}.`))]);
  for (const c of cases) for (const id of c.criteria) if (!det.has(id) && !llm.has(id)) throw new Error(`${stage.skill}: case ${c.id} lists unknown criterion "${id}"`);
}

function makeCtx(c: Case, dir: string, reply: string, finalReply: string): CheckCtx {
  return {
    c,
    key: c.key,
    dir,
    reply,
    finalReply,
    read: (name) => {
      const p = path.join(dir, name);
      return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
    },
  };
}

async function gradeTrial(stage: StageDef, c: Case, trial: number, ctxArgs: { dir: string; relDir: string; reply: string; finalReply: string }): Promise<{ criteria: CriterionResult[]; judgeCost: number; judgeTokens: Tokens; judgeError?: string }> {
  const ctx = makeCtx(c, ctxArgs.dir, ctxArgs.reply, ctxArgs.finalReply);
  const criteria: CriterionResult[] = [];
  const detById = new Map(loadCriteria(stage.skill).map((x) => [x.id, x]));
  for (const id of c.criteria) {
    const crit = detById.get(id);
    if (!crit) continue;
    let o;
    try {
      o = crit.run(ctx);
    } catch (e) {
      o = { pass: false, evidence: `check crashed: ${(e as Error).message}` };
    }
    if (o) criteria.push({ id, kind: "deterministic", pass: o.pass, evidence: o.evidence });
  }
  let judgeCost = 0;
  let judgeTokens = noTokens();
  let judgeError: string | undefined;
  const graderIds = new Set(loadGrader(stage.skill).map((x) => x.id));
  const wanted = loadGrader(stage.skill).filter((x) => c.criteria.includes(x.id));
  if (wanted.length && !c.expected.stop) {
    const j = await judgeWithGrader(stage, c, ctxArgs.dir, ctxArgs.reply, wanted);
    criteria.push(...j.results);
    judgeCost += j.costUsd;
    judgeTokens = addTokens(judgeTokens, j.tokens);
    if (j.error) judgeError = j.error;
  }
  for (const [id, { agent }] of Object.entries(REVIEWER_CRITERIA)) {
    if (!c.criteria.includes(id) || graderIds.has(id)) continue;
    const structure = criteria.find((x) => x.id === "s4.structure");
    if (structure && !structure.pass) continue; // like the gate: the reviewer only sees files that passed the structure check
    const j = await judgeWithReviewer(id, agent, ctxArgs.relDir, `${c.key}-${stage.artifact}`, `${c.key}-${stage.inputSuffix}`);
    criteria.push(...j.results);
    judgeCost += j.costUsd;
    judgeTokens = addTokens(judgeTokens, j.tokens);
    if (j.error) judgeError = `${id}: ${j.error}`;
  }
  void trial;
  return { criteria, judgeCost, judgeTokens, ...(judgeError ? { judgeError } : {}) };
}

async function runSkill(stage: StageDef, args: Args, resultsDir: string, budget: { spent: number; tokens: Tokens }): Promise<SkillReport> {
  const all = loadCases(stage.skill);
  validateCaseCriteria(stage, all);
  const cases = args.only ? all.filter((c) => args.only!.includes(c.id)) : all;
  if (args.only) {
    const unknown = args.only.filter((id) => !all.some((c) => c.id === id));
    if (unknown.length && cases.length === 0) throw new Error(`${stage.skill}: no such case(s): ${unknown.join(", ")}`);
  }
  const threshold = passThreshold(args.runs);
  const caseResults: (CaseResult & { trials: TrialResult[] })[] = [];
  let incomplete = false;
  let skillCost = 0;
  let skillTokens = noTokens();
  console.log(`\n== ${stage.skill}: ${cases.length} case(s) × ${args.runs} trial(s), model ${stage.model}`);

  for (const c of cases) {
    const trials: TrialResult[] = [];
    for (let n = 1; n <= args.runs; n++) {
      if (args.maxCost !== null && budget.spent >= args.maxCost) {
        incomplete = true;
        break;
      }
      const run = await runSkillTrial(stage, c, n, { timeoutMs: args.timeoutMin * 60_000, maxBudgetUsd: Math.max(1, Math.min(8, (args.maxCost ?? 8) - budget.spent)) });
      let criteria: CriterionResult[] = [];
      let judgeCost = 0;
      let judgeTokens = noTokens();
      if (!run.error) {
        const g = await gradeTrial(stage, c, n, run);
        criteria = g.criteria;
        judgeCost = g.judgeCost;
        judgeTokens = g.judgeTokens;
        if (g.judgeError) console.log(`   judge problem (ignored for pass/fail): ${g.judgeError}`);
      }
      const cost = run.costUsd + judgeCost;
      const tokens = addTokens(run.tokens, judgeTokens);
      budget.spent += cost;
      budget.tokens = addTokens(budget.tokens, tokens);
      skillCost += cost;
      skillTokens = addTokens(skillTokens, tokens);
      const t: TrialResult = {
        case: c.id,
        trial: n,
        ...(run.error ? { error: run.error } : {}),
        criteria,
        pass: !run.error && criteria.filter((x) => x.kind === "deterministic").every((x) => x.pass),
        cost_usd: cost,
        tokens,
        skill_tokens: run.tokens,
        turns: run.turns,
        duration_ms: run.durationMs,
      };
      // Keep the finished folder outside .eval-runs/ so the next trial cannot see it.
      const kept = path.join(resultsDir, "trials", path.basename(run.dir));
      fs.mkdirSync(path.dirname(kept), { recursive: true });
      fs.renameSync(run.dir, kept);
      t.dir = path.relative(EVALS_DIR, kept).split(path.sep).join("/");
      trials.push(t);
      const bad = criteria.filter((x) => !x.pass).map((x) => `${x.id}${x.kind === "llm" ? "(warn)" : ""}`);
      console.log(`   ${c.id}#${n}: ${t.error ? `ERROR ${t.error}` : t.pass ? "PASS" : "FAIL"}  ${tokens.total.toLocaleString("en-US")} tok  $${cost.toFixed(2)}  ${Math.round(run.durationMs / 1000)}s${bad.length ? `  failed: ${bad.join(", ")}` : ""}`);
    }
    if (trials.length === 0) continue;
    const passed = trials.filter((t) => t.pass).length;
    caseResults.push({ id: c.id, pass: passed >= passThreshold(trials.length), trials_passed: passed, of: trials.length, trials });
  }

  const results: Record<string, CaseResult> = Object.fromEntries(caseResults.map((r) => [r.id, { id: r.id, pass: r.pass, trials_passed: r.trials_passed, of: r.of }]));
  return {
    skill: stage.skill,
    runs: args.runs,
    threshold,
    partial: args.only !== null && cases.length < all.length,
    cases: caseResults,
    diff: diffAgainst(stage.skill, results, args.only !== null && cases.length < all.length),
    hash: casesHash(stage.skill),
    costUsd: skillCost,
    tokens: skillTokens,
    incomplete,
  };
}

async function main(): Promise<void> {
  let args: Args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`[ERROR] ${(e as Error).message}\n${USAGE}`);
    process.exit(2);
  }

  if (args.probeLeak) {
    const r = await probeLeak();
    console.log(`Leak probe: ${r.denied ? "DENIED (ok)" : "NOT DENIED"} — ${r.detail}`);
    process.exit(r.denied ? 0 : 1);
  }

  const stages = args.skill === "all" ? STAGES : [stageOf(args.skill)];
  if (args.only && stages.length > 1) {
    console.error("[ERROR] --only needs one --skill");
    process.exit(2);
  }
  if (args.update && !args.reason.trim()) {
    console.error('[ERROR] --update-baseline needs --reason "…"');
    process.exit(2);
  }
  if (args.update && args.maxCost !== null) console.log("note: --max-cost-usd with --update-baseline: an incomplete run will not update the baseline");

  resetSandboxRoot();
  const started = new Date().toISOString();
  const resultsDir = path.join(EVALS_DIR, "results", stamp());
  fs.mkdirSync(resultsDir, { recursive: true });
  const budget = { spent: 0, tokens: noTokens() };
  const reports: SkillReport[] = [];
  let exit = 0;

  // report.md + results.json are rewritten after every finished skill (and on Ctrl-C), so stopping a long run
  // keeps everything finished so far. `run_complete` is true only for the last write.
  const flush = (complete: boolean): void =>
    writeResults(resultsDir, reports, {
      started,
      runs: args.runs,
      skills: stages.map((s) => s.skill),
      max_cost_usd: args.maxCost,
      total_cost_usd: budget.spent,
      total_tokens: budget.tokens,
      run_complete: complete,
    });
  process.on("SIGINT", () => {
    flush(false);
    console.log(`\n!! interrupted: report for the ${reports.length} finished skill(s) written to ${path.relative(process.cwd(), resultsDir)} (the skill in progress is not included)`);
    fs.rmSync(SANDBOX_ROOT, { recursive: true, force: true });
    process.exit(130);
  });

  for (const stage of stages) {
    let report: SkillReport;
    try {
      report = await runSkill(stage, args, resultsDir, budget);
    } catch (e) {
      console.error(`[ERROR] ${(e as Error).message}`);
      exit = 2;
      break;
    }
    reports.push(report);
    console.log(`\n${renderSkill(report)}`);
    flush(false);
    console.log(`report so far: ${path.relative(process.cwd(), path.join(resultsDir, "report.md"))}`);
    if (report.incomplete) exit = Math.max(exit, 2);
    if (report.diff.regressions.length) exit = 1;
    else if (report.diff.hashChanged && !args.update) {
      console.log(`!! ${stage.skill}: cases or inputs changed since the baseline, the numbers are not comparable. Re-run all cases with --update-baseline --reason "…".`);
      exit = 1;
    }
    if (args.update && !report.incomplete) {
      const results = Object.fromEntries(report.cases.map((r) => [r.id, { id: r.id, pass: r.pass, trials_passed: r.trials_passed, of: r.of }]));
      const err = updateBaseline({ skill: stage.skill, results, reason: args.reason, allowDecrease: args.allowDecrease, partial: report.partial });
      if (err) {
        console.error(`!! baseline NOT updated: ${err}`);
        exit = 1;
      } else console.log(`baseline updated: ${stage.skill} (${args.reason})`);
    }
    if (args.maxCost !== null && budget.spent >= args.maxCost) console.log(`!! cost ceiling $${args.maxCost} reached ($${budget.spent.toFixed(2)}); remaining trials were not run`);
  }

  flush(reports.length === stages.length && !reports.some((r) => r.incomplete));
  const errs = reports.flatMap((r) => errorsOf(r.cases.flatMap((c) => c.trials)));
  const llmFails = reports.flatMap((r) => failureCounter(r.cases.flatMap((c) => c.trials)).filter((x) => x.kind === "llm"));
  console.log(`\nresults: ${path.relative(process.cwd(), resultsDir)} · total ${fmtTokens(budget.tokens)} · API-list-price estimate $${budget.spent.toFixed(2)}${llmFails.length ? ` · ${llmFails.length} LLM criterion warning(s)` : ""}${errs.length ? ` · ${errs.length} trial error(s)` : ""}`);
  fs.rmSync(SANDBOX_ROOT, { recursive: true, force: true });
  process.exit(exit);
}

main().catch((e: unknown) => {
  console.error("[FATAL]", (e as Error).message ?? e);
  process.exit(2);
});
