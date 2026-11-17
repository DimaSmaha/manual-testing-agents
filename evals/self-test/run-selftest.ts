// Calibration of the checks (free, deterministic, seconds):  npm run eval:selftest
//   - every known-bad fixture must FAIL the criteria it is labelled with;
//   - the real validated runs (`expectPass`) must pass the deterministic checks;
//   - every deterministic criterion has at least one known-bad fixture.
// With --real the stage 4 reviewer (expl1-test-cases-reviewer) is also run on the labelled tc6-* defects of the gate
// fixtures: real model calls, ~$0.1 each.
import * as fs from "fs";
import * as path from "path";
import { SANDBOX_ROOT } from "../lib/run-skill";
import { loadCases, loadCriteria, STAGES } from "../lib/stages";
import type { Case, CheckCtx, Expected } from "../lib/types";
import { judgeWithReviewer } from "../lib/llm-judge";
import { GROUND_TRUTH_FIELDS, realReviewerCases, selfCases, type Files } from "./cases";
import { compareWithGate } from "./gate-parity";

const real = process.argv.includes("--real");
const ROOT = path.join(SANDBOX_ROOT, "_selftest");

function materialize(name: string, files: Files): string {
  const dir = path.join(ROOT, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const [f, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, f), text);
  return dir;
}

async function main(): Promise<void> {
  const failures: string[] = [];
  let parity = 0; // fixtures on which the evals' structure validator and the feedback-loop validator were compared
  const hit = new Set<string>(); // criteria with a known-bad fixture that failed them
  let n = 0;

  for (const sc of selfCases()) {
    const stage = STAGES.find((s) => s.n === sc.stage)!;
    const found = loadCases(stage.skill).find((x) => x.id === sc.caseId);
    if (!found) throw new Error(`self-test ${sc.id}: no case ${sc.caseId} in ${stage.skill}`);
    // The ground-truth fields describe the frozen eval inputs: only fixtures built from them keep them (see SelfCase).
    const expected: Expected = { ...found.expected };
    if (!sc.caseExpected) for (const f of GROUND_TRUTH_FIELDS) delete expected[f];
    const c: Case = { ...found, expected: { ...expected, ...sc.expected } };
    const dir = materialize(`s${sc.stage}-${sc.id}`, sc.files);
    const par = await compareWithGate(sc.stage, dir, c.key);
    if (par.compared) {
      n += 1;
      parity += 1;
      if (par.problem) failures.push(`${stage.skill} / ${sc.id}: parity with the feedback-loop validator — ${par.problem}`);
    }
    const reply = sc.reply ?? "";
    const ctx: CheckCtx = {
      c,
      key: c.key,
      dir,
      reply,
      finalReply: reply,
      read: (f) => (fs.existsSync(path.join(dir, f)) ? fs.readFileSync(path.join(dir, f), "utf8") : null),
    };
    const crits = loadCriteria(stage.skill).filter((k) => c.criteria.includes(k.id));
    const got = new Map<string, { pass: boolean; evidence: string }>();
    for (const k of crits) {
      const o = k.run(ctx);
      if (o) got.set(k.id, o);
    }
    const label = `${stage.skill} / ${sc.id}`;
    for (const id of sc.expectFail) {
      const o = got.get(id);
      n += 1;
      if (!o) failures.push(`${label}: ${id} did not run (not applicable?)`);
      else if (o.pass) failures.push(`${label}: ${id} PASSED a known-bad fixture`);
      else hit.add(id);
    }
    const mustPass = sc.expectPass?.includes("all") ? [...got.keys()] : (sc.expectPass ?? []);
    for (const id of mustPass) {
      const o = got.get(id);
      n += 1;
      if (!o) failures.push(`${label}: ${id} did not run`);
      else if (!o.pass) failures.push(`${label}: ${id} FAILED a good fixture — ${o.evidence}`);
    }
    const flagged = [...got].filter(([, o]) => !o.pass).map(([id]) => id);
    console.log(`${flagged.length === 0 && sc.expectFail.length === 0 ? "ok  " : "    "}${label}: failed [${flagged.join(", ") || "-"}] expected-fail [${sc.expectFail.join(", ") || "-"}]`);
  }

  for (const stage of STAGES) {
    for (const k of loadCriteria(stage.skill)) {
      n += 1;
      if (!hit.has(k.id)) failures.push(`${stage.skill}: criterion ${k.id} has no known-bad fixture that fails it`);
    }
  }

  if (real) {
    console.log("\n-- real reviewer on the labelled gate fixtures");
    for (const rc of realReviewerCases()) {
      const key = "TASK-114";
      const dir = materialize(`real-${rc.id}`, rc.files);
      const rel = path.relative(process.cwd(), dir).split(path.sep).join("/");
      const j = await judgeWithReviewer("s4.llm-reviewer", "expl1-test-cases-reviewer", rel, `${key}-4-test-cases.md`, `${key}-3-checklist.md`);
      n += 1;
      if (j.error) failures.push(`reviewer ${rc.id}: could not run — ${j.error}`);
      else {
        const verdict = j.results[0]!.pass ? "PASS" : "FAIL";
        console.log(`   ${rc.id}: reviewer ${verdict} (expected ${rc.expectReviewer}) $${j.costUsd.toFixed(2)}`);
        if (verdict !== rc.expectReviewer) failures.push(`reviewer ${rc.id}: verdict ${verdict}, expected ${rc.expectReviewer} — ${j.results[0]!.evidence.slice(0, 200)}`);
      }
    }
  }

  fs.rmSync(ROOT, { recursive: true, force: true });
  if (failures.length) {
    console.error(`\nSELF-TEST FAILED (${failures.length} of ${n} assertions):`);
    for (const f of failures) console.error(`- ${f}`);
    process.exit(1);
  }
  console.log(`\nSELF-TEST PASSED (${n} assertions, ${parity} of them compare the evals' structure validator with the feedback-loop one)`);
}

main().catch((e: unknown) => {
  console.error("[FATAL]", (e as Error).message ?? e);
  process.exit(2);
});
