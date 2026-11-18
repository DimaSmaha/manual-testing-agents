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

export function renderSkill(r: SkillReport): string {
  const trials = r.cases.flatMap((c) => c.trials);
  const out: string[] = [];
  out.push(`## ${r.skill}`, "");
  out.push(`pass rate ${pct(r.diff.passRate)} (${r.cases.filter((c) => c.pass).length}/${r.cases.length} cases, ${r.runs} trial(s) each, a case passes at ${r.threshold}) · ${fmtTokens(r.tokens)} · est. API cost $${r.costUsd.toFixed(2)} · cases_hash ${r.hash}`);
  if (r.diff.noBaseline) out.push("", "No baseline yet (`--update-baseline --reason \"…\"` creates it).");
  else if (r.diff.hashChanged) out.push("", `**Not comparable:** the cases or inputs changed since the baseline (needs \`--update-baseline --reason\`).`);
  else out.push("", `Baseline ${r.diff.baselineRate === null ? "-" : pct(r.diff.baselineRate)} → now ${pct(r.diff.passRate)}.`);
  if (r.incomplete) out.push("", "**Incomplete:** the cost ceiling stopped the run before every trial ran.");
  out.push("", "| Case | Result | Trials | Baseline | Tokens | In | Out | Cache read | Cache write |", "|---|---|---|---|---|---|---|---|---|");
  const n = (v: number): string => v.toLocaleString("en-US");
  for (const c of r.cases) {
    const tag = r.diff.regressions.includes(c.id) ? "REGRESSION" : r.diff.fixes.includes(c.id) ? "fixed" : r.diff.newCases.includes(c.id) ? "new" : "same";
    const t = c.trials.reduce((acc, x) => addTokens(acc, x.tokens), noTokens());
    out.push(`| ${c.id} | ${c.pass ? "pass" : "FAIL"} | ${c.trials_passed}/${c.of} | ${r.diff.noBaseline ? "-" : tag} | ${n(t.total)} | ${n(t.input)} | ${n(t.output)} | ${n(t.cache_read)} | ${n(t.cache_write)} |`);
  }
  out.push("", "_Tokens: every API call of the trial's skill run and its judges, summed over all trials of the case; same fields as the run metrics report (`<KEY>-metrics.md`). Cost is an API list-price estimate, not plan usage._");
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

export function renderReport(reports: SkillReport[], meta: { started: string; maxCost: number | null }): string {
  const total = reports.reduce((n, r) => n + r.costUsd, 0);
  const totalTokens = reports.reduce((t, r) => addTokens(t, r.tokens), noTokens());
  const regs = reports.flatMap((r) => r.diff.regressions.map((c) => `${r.skill}/${c}`));
  const head = [
    "# expl1 skill evals",
    "",
    `Started ${meta.started} · total ${fmtTokens(totalTokens)} · est. API cost $${total.toFixed(2)}${meta.maxCost ? ` of $${meta.maxCost} ceiling` : ""}`,
    regs.length ? `\n**Regressions (exit 1):** ${regs.join(", ")}` : "\nNo regressions against the baselines.",
    "",
  ];
  return [...head, ...reports.map(renderSkill)].join("\n");
}

export function writeResults(dir: string, reports: SkillReport[], meta: Record<string, unknown>): void {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "results.json"), `${JSON.stringify({ meta, skills: reports }, null, 2)}\n`);
  fs.writeFileSync(path.join(dir, "report.md"), renderReport(reports, { started: String(meta["started"] ?? ""), maxCost: (meta["max_cost_usd"] as number | null) ?? null }));
}
