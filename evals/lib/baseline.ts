// Baseline = the last accepted result of one skill: per-case pass/fail, the hash of the cases it was measured on, history.
// Rules (evals/README.md): a regression is a case that passed in the baseline and fails now (exit 1) even if the average
// rose; a different cases_hash means the numbers are not comparable; the baseline moves only with a reason, and down only
// with --allow-decrease.
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { skillDir } from "./stages";
import type { Baseline, CaseResult } from "./types";

export function baselinePath(skill: string): string {
  return path.join(skillDir(skill), "baseline.json");
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]))
    .sort();
}

/** Hash of cases.jsonl and every frozen input: change either and the old numbers no longer describe the same test. */
export function casesHash(skill: string): string {
  const root = skillDir(skill);
  const h = crypto.createHash("sha256");
  for (const f of [path.join(root, "cases.jsonl"), ...walk(path.join(root, "inputs"))]) {
    h.update(path.relative(root, f).split(path.sep).join("/"));
    h.update(fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n"));
  }
  return h.digest("hex").slice(0, 16);
}

export function loadBaseline(skill: string): Baseline | null {
  const p = baselinePath(skill);
  return fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, "utf8")) as Baseline) : null;
}

/** A case passes when at least ceil(2/3 of the trials) pass: 1 of 1, 2 of 2, 2 of 3, 4 of 5. */
export const passThreshold = (runs: number): number => Math.ceil((runs * 2) / 3);

export interface Diff {
  comparable: boolean;
  noBaseline: boolean;
  hashChanged: boolean;
  regressions: string[]; // pass -> fail
  fixes: string[]; // fail -> pass
  newCases: string[];
  passRate: number;
  baselineRate: number | null;
}

export const rateOf = (results: Record<string, CaseResult>): number => {
  const all = Object.values(results);
  return all.length ? all.filter((r) => r.pass).length / all.length : 0;
};

export function diffAgainst(skill: string, results: Record<string, CaseResult>, partial: boolean): Diff {
  const base = loadBaseline(skill);
  const hash = casesHash(skill);
  const passRate = rateOf(results);
  if (!base) return { comparable: false, noBaseline: true, hashChanged: false, regressions: [], fixes: [], newCases: [], passRate, baselineRate: null };
  const hashChanged = base.cases_hash !== hash;
  const regressions: string[] = [];
  const fixes: string[] = [];
  const newCases: string[] = [];
  for (const [id, r] of Object.entries(results)) {
    const b = base.results[id];
    if (!b) newCases.push(id);
    else if (b.pass && !r.pass) regressions.push(id);
    else if (!b.pass && r.pass) fixes.push(id);
  }
  // a partial (--only) run compares its cases only
  const baselineRate = partial ? rateOf(Object.fromEntries(Object.entries(base.results).filter(([id]) => id in results))) : base.pass_rate;
  return { comparable: !hashChanged, noBaseline: false, hashChanged, regressions, fixes, newCases, passRate, baselineRate };
}

export interface UpdateArgs {
  skill: string;
  results: Record<string, CaseResult>;
  reason: string;
  allowDecrease: boolean;
  partial: boolean;
}

/** Write the baseline. Returns an error message when a rule forbids it. */
export function updateBaseline(a: UpdateArgs): string | null {
  if (!a.reason.trim()) return '--update-baseline needs --reason "…" (why the baseline moves)';
  const old = loadBaseline(a.skill);
  const hash = casesHash(a.skill);
  const hashChanged = old !== null && old.cases_hash !== hash;
  if (hashChanged && a.partial) return "cases or inputs changed since the baseline: a partial (--only) run cannot replace it, run all cases";
  let merged: Record<string, CaseResult> = a.results;
  if (old && a.partial) merged = { ...old.results, ...a.results };
  const rate = rateOf(merged);
  if (old && !hashChanged) {
    const worse = Object.keys(a.results).filter((id) => old.results[id]?.pass && !a.results[id]!.pass);
    if ((rate < old.pass_rate || worse.length) && !a.allowDecrease) {
      return `the baseline would go down (${(old.pass_rate * 100).toFixed(0)}% -> ${(rate * 100).toFixed(0)}%${worse.length ? `, regressed: ${worse.join(", ")}` : ""}); fix the skill, or pass --allow-decrease with a --reason`;
    }
  }
  const date = new Date().toISOString();
  const next: Baseline = {
    skill: a.skill,
    cases_hash: hash,
    last_run: date,
    total_cases: Object.keys(merged).length,
    pass_rate: rate,
    results: merged,
    history: [...(old?.history ?? []), { date, pass_rate: rate, cases_hash: hash, reason: a.reason }],
    changed: old === null || hashChanged || old.pass_rate !== rate,
    reason: a.reason,
  };
  fs.writeFileSync(baselinePath(a.skill), `${JSON.stringify(next, null, 2)}\n`);
  return null;
}
