// Set the baseline of one or more skills from a finished eval run, without running the eval again (no model calls).
//
//   npm run eval:set-baseline -- <results-dir|results.json> --reason "…" [--skill <name|all>] [--allow-decrease]
//
// Example: npm run eval:set-baseline -- evals/results/20261117-113820 --reason "Initial baseline"
//
// It calls the same updateBaseline() as `npm run eval -- --update-baseline`, so every baseline rule still applies
// (a reason is required, the baseline goes down only with --allow-decrease). It refuses an incomplete run and a run
// measured on cases/inputs that have changed since (cases_hash differs): re-run the eval then.
import * as fs from "fs";
import * as path from "path";
import { casesHash, updateBaseline } from "./lib/baseline";
import { stageOf } from "./lib/stages";
import type { CaseResult } from "./lib/types";

const USAGE = 'Usage: npm run eval:set-baseline -- <results-dir|results.json> --reason "…" [--skill <name|all>] [--allow-decrease]';

interface SavedSkill {
  skill: string;
  partial: boolean;
  incomplete: boolean;
  hash?: string;
  cases: CaseResult[];
}

interface Args {
  target: string;
  skill: string;
  reason: string;
  allowDecrease: boolean;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { target: "", skill: "all", reason: "", allowDecrease: false };
  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = argv[i]!.split("=", 2) as [string, string | undefined];
    const value = (): string => {
      const v = inline ?? argv[++i];
      if (v === undefined) throw new Error(`${flag} needs a value`);
      return v;
    };
    if (flag === "--skill") a.skill = value();
    else if (flag === "--reason") a.reason = value();
    else if (flag === "--allow-decrease") a.allowDecrease = true;
    else if (flag.startsWith("--")) throw new Error(`Unknown option ${argv[i]}`);
    else if (!a.target) a.target = argv[i]!;
    else throw new Error(`Unexpected argument ${argv[i]}`);
  }
  if (!a.target) throw new Error("the results folder (or results.json) is required");
  if (!a.reason.trim()) throw new Error('--reason "…" is required (why the baseline moves)');
  return a;
}

function main(): number {
  const args = parseArgs(process.argv.slice(2));
  const resolved = path.resolve(args.target);
  const file = fs.existsSync(resolved) && fs.statSync(resolved).isDirectory() ? path.join(resolved, "results.json") : resolved;
  if (!fs.existsSync(file)) throw new Error(`not found: ${file}`);

  const saved = JSON.parse(fs.readFileSync(file, "utf8")) as { skills?: SavedSkill[] };
  const all = saved.skills ?? [];
  const picked = args.skill === "all" ? all : all.filter((s) => s.skill === stageOf(args.skill).skill);
  if (!picked.length) throw new Error(`no matching skill in ${file} (it holds: ${all.map((s) => s.skill).join(", ") || "nothing"})`);

  let failed = false;
  for (const s of picked) {
    if (s.incomplete) {
      console.error(`!! ${s.skill}: the run was incomplete (cost ceiling), not a valid baseline`);
      failed = true;
      continue;
    }
    const now = casesHash(s.skill);
    if (!s.hash) {
      console.error(`!! ${s.skill}: results.json has no cases_hash, cannot tell whether the cases changed since the run`);
      failed = true;
      continue;
    }
    if (s.hash !== now) {
      console.error(`!! ${s.skill}: cases or inputs changed since this run (run ${s.hash}, now ${now}), re-run the eval`);
      failed = true;
      continue;
    }
    const results = Object.fromEntries(s.cases.map((c) => [c.id, { id: c.id, pass: c.pass, trials_passed: c.trials_passed, of: c.of }]));
    const err = updateBaseline({ skill: s.skill, results, reason: args.reason, allowDecrease: args.allowDecrease, partial: s.partial });
    if (err) {
      console.error(`!! ${s.skill}: baseline NOT updated: ${err}`);
      failed = true;
    } else {
      const n = Object.values(results);
      console.log(`baseline updated: ${s.skill} (${n.filter((r) => r.pass).length}/${n.length} cases pass) — ${args.reason}`);
    }
  }
  return failed ? 1 : 0;
}

try {
  process.exit(main());
} catch (e) {
  console.error(`[ERROR] ${(e as Error).message}\n${USAGE}`);
  process.exit(2);
}
