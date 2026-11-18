// Report: failures grouped by criterion (which rule breaks, how often), the failure evidence, a per-case table with the
// baseline diff, and results.json for CI. LLM-criterion failures are warnings, deterministic ones decide the exit code.
import * as fs from "fs";
import * as path from "path";
import type { Diff } from "./baseline";
import { addTokens, fmtTokens, noTokens } from "./tokens";
import type { CaseResult, Tokens, TrialResult } from "./types";

export interface SkillReport {
  skill: string;
  runs: number;
  threshold: number;
  partial: boolean;
  cases: (CaseResult & { trials: TrialResult[] })[];
  diff: Diff;
  hash: string;
  costUsd: number; // skill trials + judges (API list price estimate, not plan usage)
  tokens: Tokens; // skill trials + judges
  incomplete: boolean; // the cost ceiling stopped the run before every trial ran
}

export interface FailureRow {
  id: string;
  kind: "deterministic" | "llm";
  failed: number;
  of: number;
  cases: string[];
  evidence: string;
}

/** Counter of failures per criterion over all trials of a skill (notes step 2: group by criterion, not by case). */
export function failureCounter(trials: TrialResult[]): FailureRow[] {
  const rows = new Map<string, FailureRow>();
  for (const t of trials) {
    for (const c of t.criteria) {
      const row = rows.get(c.id) ?? { id: c.id, kind: c.kind, failed: 0, of: 0, cases: [], evidence: "" };
      row.of += 1;
      if (!c.pass) {
        row.failed += 1;
        if (!row.cases.includes(t.case)) row.cases.push(t.case);
        if (!row.evidence) row.evidence = `[${t.case}#${t.trial}] ${c.evidence}`;
      }
      rows.set(c.id, row);
    }
  }
  return [...rows.values()].filter((r) => r.failed > 0).sort((a, b) => b.failed - a.failed);
}

export function errorsOf(trials: TrialResult[]): string[] {
  return trials.filter((t) => t.error).map((t) => `${t.case}#${t.trial}: ${t.error}`);
}

const pct = (n: number): string => `${Math.round(n * 100)}%`;

/** `45s`, `3m 05s`, `1h 02m`. */
export function fmtDur(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, "0")}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

/** Time of one trial end to end (skill + grading); results saved before `total_ms` existed fall back to the skill run. */
const trialMs = (t: TrialResult): number => t.total_ms ?? t.duration_ms;
const sumMs = (trials: TrialResult[]): number => trials.reduce((n, t) => n + trialMs(t), 0);

export function renderSkill(r: SkillReport): string {
  const trials = r.cases.flatMap((c) => c.trials);
  const out: string[] = [];
  out.push(`## ${r.skill}`, "");
  out.push(`pass rate ${pct(r.diff.passRate)} (${r.cases.filter((c) => c.pass).length}/${r.cases.length} cases, ${r.runs} trial(s) each, a case passes at ${r.threshold}) · ${fmtTokens(r.tokens)} · est. API cost $${r.costUsd.toFixed(2)} · time ${fmtDur(sumMs(trials))} (${trials.length ? `${fmtDur(sumMs(trials) / trials.length)} per trial` : "no trials"}) · cases_hash ${r.hash}`);
  if (r.diff.noBaseline) out.push("", "No baseline yet (`--update-baseline --reason \"…\"` creates it).");
  else if (r.diff.hashChanged) out.push("", `**Not comparable:** the cases or inputs changed since the baseline (needs \`--update-baseline --reason\`).`);
  else out.push("", `Baseline ${r.diff.baselineRate === null ? "-" : pct(r.diff.baselineRate)} → now ${pct(r.diff.passRate)}.`);
  if (r.incomplete) out.push("", "**Incomplete:** the cost ceiling stopped the run before every trial ran.");
  out.push("", "| Case | Result | Trials | Baseline | Time (all trials) | Per trial | Est. cost | Tokens | In | Out | Cache read | Cache write |", "|---|---|---|---|---|---|---|---|---|---|---|---|");
  const n = (v: number): string => v.toLocaleString("en-US");
  for (const c of r.cases) {
    const tag = r.diff.regressions.includes(c.id) ? "REGRESSION" : r.diff.fixes.includes(c.id) ? "fixed" : r.diff.newCases.includes(c.id) ? "new" : "same";
    const t = c.trials.reduce((acc, x) => addTokens(acc, x.tokens), noTokens());
    const usd = c.trials.reduce((acc, x) => acc + x.cost_usd, 0);
    out.push(`| ${c.id} | ${c.pass ? "pass" : "FAIL"} | ${c.trials_passed}/${c.of} | ${r.diff.noBaseline ? "-" : tag} | ${fmtDur(sumMs(c.trials))} | ${c.trials.map((x) => fmtDur(trialMs(x))).join(" · ")} | $${usd.toFixed(2)} | ${n(t.total)} | ${n(t.input)} | ${n(t.output)} | ${n(t.cache_read)} | ${n(t.cache_write)} |`);
  }
  out.push("", "_Time: each trial end to end (skill run + checks + judges), summed over the case's trials; \"Per trial\" lists them in order. Tokens: every API call of the skill run and its judges, summed over the case's trials; same fields as the run metrics report (`<KEY>-metrics.md`). Est. cost is an API list-price estimate, not plan usage._");
  const rows = failureCounter(trials);
  const det = rows.filter((x) => x.kind === "deterministic");
  const llm = rows.filter((x) => x.kind === "llm");
  if (det.length) {
    out.push("", "### Failed criteria (hard gate)", "");
    for (const x of det) out.push(`- **${x.id}** failed ${x.failed}/${x.of} trials (${x.cases.join(", ")}) — ${x.evidence}`);
  }
  if (llm.length) {
    out.push("", "### LLM criteria failed (warning only)", "");
    for (const x of llm) out.push(`- **${x.id}** failed ${x.failed}/${x.of} trials (${x.cases.join(", ")}) — ${x.evidence}`);
  }
  const errs = errorsOf(trials);
  if (errs.length) out.push("", "### Trial errors (counted as fail)", "", ...errs.map((e) => `- ${e}`));
  out.push("");
  return out.join("\n");
}

/**
 * How to accept this run as the new baseline: the `eval:set-baseline` command (no new model calls) for every skill that can
 * be baselined, and a short reason for each skill that cannot. Printed at the end of the console output and of report.md.
 */
export function baselineHints(reports: SkillReport[], resultsRel: string, runComplete: boolean): string[] {
  if (reports.length === 0) return [];
  const ok: string[] = [];
  const notes: string[] = [];
  let needsAllowDecrease = false;
  for (const r of reports) {
    const errs = errorsOf(r.cases.flatMap((c) => c.trials)).length;
    const d = r.diff;
    if (r.incomplete) notes.push(`${r.skill}: incomplete (cost ceiling), not a valid baseline`);
    else if (errs) notes.push(`${r.skill}: ${errs} trial error(s), fix the cause and re-run before baselining`);
    else if (d.hashChanged && r.partial) notes.push(`${r.skill}: cases changed since the baseline, a partial (--only) run cannot replace it; run all cases`);
    else if (!d.noBaseline && !d.hashChanged && !d.regressions.length && !d.fixes.length && !d.newCases.length && d.baselineRate === d.passRate) notes.push(`${r.skill}: same as the current baseline, nothing to update`);
    else {
      ok.push(r.skill);
      if (d.regressions.length) needsAllowDecrease = true;
    }
  }
  const out: string[] = [];
  if (ok.length) {
    const allow = needsAllowDecrease ? " --allow-decrease" : "";
    const cmd = (skill: string | null): string => `npm run eval:set-baseline -- ${resultsRel} --reason "<why the baseline moves>"${skill ? ` --skill ${skill}` : ""}${allow}`;
    out.push(ok.length === reports.length ? cmd(null) : ok.map((s) => cmd(s)).join("\n"));
    if (needsAllowDecrease) out.push("(--allow-decrease is needed: a case that passed in the baseline fails now. Accept that only on purpose.)");
    if (!runComplete) out.push("(the run was not finished: only the skills above that finished are in results.json)");
  }
  out.push(...notes.map((n) => `- ${n}`));
  return out;
}

export function renderReport(reports: SkillReport[], meta: { started: string; maxCost: number | null; complete?: boolean; skills?: string[]; resultsRel?: string; finished?: string }): string {
  const testMs = sumMs(reports.flatMap((r) => r.cases.flatMap((c) => c.trials)));
  const wallMs = Date.parse(meta.finished ?? "") - Date.parse(meta.started);
  const timeLine = `test time ${fmtDur(testMs)} (sum of all trials)${Number.isFinite(wallMs) && wallMs > 0 ? ` · wall clock ${fmtDur(wallMs)}` : ""}`;
  const missing = (meta.skills ?? []).filter((s) => !reports.some((r) => r.skill === s));
  const total = reports.reduce((n, r) => n + r.costUsd, 0);
  const totalTokens = reports.reduce((t, r) => addTokens(t, r.tokens), noTokens());
  const regs = reports.flatMap((r) => r.diff.regressions.map((c) => `${r.skill}/${c}`));
  const head = [
    "# expl1 skill evals",
    "",
    `Started ${meta.started} · total ${fmtTokens(totalTokens)} · est. API cost $${total.toFixed(2)}${meta.maxCost ? ` of $${meta.maxCost} ceiling` : ""} · ${timeLine}`,
    regs.length ? `\n**Regressions (exit 1):** ${regs.join(", ")}` : "\nNo regressions against the baselines.",
    ...(meta.complete === false ? ["", `**Run not finished** — skills without a result: ${missing.length ? missing.join(", ") : "none (a cost ceiling or error stopped it)"}.`] : []),
    "",
  ];
  const hints = meta.resultsRel ? baselineHints(reports, meta.resultsRel, meta.complete !== false) : [];
  const tail = hints.length ? ["## Update the baseline", "", "```", hints.filter((h) => h.startsWith("npm ")).join("\n"), "```", "", ...hints.filter((h) => !h.startsWith("npm ")), ""] : [];
  return [...head, ...reports.map(renderSkill), ...tail].join("\n");
}

export function writeResults(dir: string, reports: SkillReport[], meta: Record<string, unknown>): void {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "results.json"), `${JSON.stringify({ meta, skills: reports }, null, 2)}\n`);
  fs.writeFileSync(path.join(dir, "report.md"), renderReport(reports, { started: String(meta["started"] ?? ""), maxCost: (meta["max_cost_usd"] as number | null) ?? null, complete: meta["run_complete"] as boolean | undefined, skills: meta["skills"] as string[] | undefined, resultsRel: meta["results_dir"] as string | undefined, finished: meta["finished"] as string | undefined }));
}
