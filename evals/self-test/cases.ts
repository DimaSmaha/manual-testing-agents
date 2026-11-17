// Calibration cases of the deterministic checks. Every check needs at least one known-bad fixture that must FAIL it, and the
// real, gate-validated runs (.claude/hooks/test/fixtures/*/_base and the frozen eval inputs) must PASS the checks they
// are meant to satisfy. Bad fixtures reuse the `edits` of the gate fixtures where one fits; the rest are edits written here.
import * as fs from "fs";
import * as path from "path";
import { EVALS_DIR, REPO_ROOT } from "../lib/stages";
import type { Expected } from "../lib/types";

export type Files = Record<string, string>;
export interface Edit {
  find: string;
  replace: string;
  all?: boolean; // replace every occurrence (default: the text must occur exactly once)
}

export interface SelfCase {
  id: string;
  stage: 1 | 2 | 3 | 4;
  caseId: string; // case of evals/<skill>/cases.jsonl whose `expected` applies
  files: Files;
  reply?: string;
  expectFail: string[]; // criteria that must fail
  expectPass?: string[]; // criteria that must pass ("all" = every applicable deterministic criterion)
  /**
   * The ground-truth fields of the case's `expected` (goal, context_requirements, reqs, min_test_cases) describe the
   * eval's frozen inputs. They apply only to fixtures built from those inputs (`caseExpected: true`); the gate fixtures
   * are a different TASK-114 chain, so the fields are dropped there unless `expected` states them.
   */
  caseExpected?: boolean;
  expected?: Partial<Expected>; // overrides applied on top
}

export const GROUND_TRUTH_FIELDS = ["goal", "context_requirements", "reqs", "min_test_cases"] as const;

const HOOK_FIXTURES = path.join(REPO_ROOT, ".claude", "hooks", "test", "fixtures");
const rd = (p: string): string => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const evalInput = (skill: string, caseId: string, file: string): string => rd(path.join(EVALS_DIR, skill, "inputs", caseId, file));

export function edit(files: Files, name: string, edits: Edit[]): Files {
  const out = { ...files };
  let text = out[name];
  if (text === undefined) throw new Error(`self-test: no file ${name}`);
  edits.forEach((e, i) => {
    const n = text!.split(e.find).length - 1;
    if (n === 0 || (n > 1 && !e.all)) throw new Error(`self-test: edit #${i + 1} of ${name}: ${JSON.stringify(e.find.slice(0, 60))} occurs ${n} times`);
    text = text!.split(e.find).join(e.replace);
  });
  out[name] = text!;
  return out;
}

/** Files of a gate fixture folder: `_base`, with the case's own copies and `edits` (applied to `target`). */
export function hookFixture(kind: string, name: string | null, target: string): Files {
  const base = path.join(HOOK_FIXTURES, kind, "_base");
  let files: Files = Object.fromEntries(fs.readdirSync(base).map((f) => [f, rd(path.join(base, f))]));
  if (name) {
    const dir = path.join(HOOK_FIXTURES, kind, name);
    for (const f of fs.readdirSync(dir)) if (f !== "case.json") files[f] = rd(path.join(dir, f));
    const spec = JSON.parse(fs.readFileSync(path.join(dir, "case.json"), "utf8")) as { edits?: Edit[] };
    if (spec.edits) files = edit(files, target, spec.edits);
  }
  return files;
}

const K = "TASK-114";
const CTX = `${K}-1-context.md`;
const REQ = `${K}-2-requirements.md`;
const CHK = `${K}-3-checklist.md`;
const TCS = `${K}-4-test-cases.md`;

const GOOD_REPLY_1 = `Saved .eval-runs/x/${K}-1-context.md`;
const GOOD_REPLY_2 = `### Questions
- REQ-6: "Ensure routing, UI consistency, and state synchronization" names no verifiable behavior → what must be consistent, and between which pages?

### Risks
- REQ-4: the state kept on return is not defined for a signed-out user → expected behavior

AUTO-DECISION: 2 grooming questions left unanswered → requirements kept as in the context

Files are in .eval-runs/x/:
- ${REQ}`; // the trailing file list is real: a bullet after the last group must not be read as a problem

// A bug context written to the stage 1 template (the live BUG-114 record is the source of the values).
const BUG_CONTEXT = `# BUG-114 - Login button stays disabled after valid credentials are entered

Source: http://localhost:3000/bugs/114
Type: bug
Severity: high
Generated: 2026-11-17

## Goal
Retest of the bug: verify that the primary Login button on the sign-in page is enabled after a user enters a valid email and password combination, so authentication can start.

## Scope
- In scope: the primary Login button on the sign-in page after a valid email and password combination is entered
- Out of scope: Not specified in the tracker

## Requirements
- On the sign-in page, the primary Login button remains disabled even after a user enters a valid email and password combination, preventing authentication from starting.

---
`;

const ctx114 = evalInput("expl1-2-requirements-grooming", "TASK-114", CTX);
const req114 = evalInput("expl1-3-qa-checklist", "TASK-114", REQ);

const stage1Base: Files = { [CTX]: ctx114 };
const stage2Base: Files = { [CTX]: ctx114, [REQ]: req114 };
const s3 = hookFixture("checklist", null, "");
const s4 = hookFixture("test-cases", null, "");

export function selfCases(): SelfCase[] {
  const c: SelfCase[] = [];

  // ── stage 1 ────────────────────────────────────────────────────────────────
  c.push({ id: "base-114", stage: 1, caseId: "TASK-114", files: stage1Base, reply: GOOD_REPLY_1, expectFail: [], expectPass: ["all"] });
  c.push({ id: "base-bug-114", stage: 1, caseId: "BUG-114", files: { "BUG-114-1-context.md": BUG_CONTEXT }, reply: "Saved", expectFail: [], expectPass: ["all"] });
  c.push({ id: "stop-reply-with-file", stage: 1, caseId: "TASK-111", files: { "TASK-111-1-context.md": "# TASK-111 - \n" }, reply: "Saved the file", expectFail: ["s1.stop-behavior"] });
  c.push({ id: "stop-expected-not-given", stage: 1, caseId: "TASK-114", files: stage1Base, reply: "STOP: tracker returned nothing", expectFail: ["s1.stop-behavior"] });
  c.push({ id: "second-h1", stage: 1, caseId: "TASK-114", files: edit(stage1Base, CTX, [{ find: "## Scope", replace: "# Scope notes\n\n## Scope" }]), reply: GOOD_REPLY_1, expectFail: ["s1.one-h1"] });
  c.push({ id: "header-no-generated", stage: 1, caseId: "TASK-114", files: edit(stage1Base, CTX, [{ find: "Generated: 2026-11-17\n", replace: "" }]), reply: GOOD_REPLY_1, expectFail: ["s1.header"] });
  c.push({ id: "section-not-in-template", stage: 1, caseId: "TASK-114", files: edit(stage1Base, CTX, [{ find: "## Scope", replace: "## Notes" }]), reply: GOOD_REPLY_1, expectFail: ["s1.sections"] });
  c.push({ id: "requirement-dropped", stage: 1, caseId: "TASK-114", files: edit(stage1Base, CTX, [{ find: "- Ensure routing, UI consistency, and state synchronization between inventory and product pages.\n", replace: "" }]), reply: GOOD_REPLY_1, expectFail: ["s1.requirement-count"] });
  c.push({
    id: "label-generalised",
    stage: 1,
    caseId: "TASK-114",
    files: edit(stage1Base, CTX, [{ find: "'Back to products'", replace: "the back button", all: true }]),
    reply: GOOD_REPLY_1,
    expectFail: ["s1.literals"],
  });
  c.push({
    id: "estimate-added",
    stage: 1,
    caseId: "TASK-114",
    files: edit(stage1Base, CTX, [{ find: "- Ensure routing, UI consistency, and state synchronization between inventory and product pages.\n", replace: "- Ensure routing, UI consistency, and state synchronization between inventory and product pages.\n- Estimate: 5 story points\n" }]),
    reply: GOOD_REPLY_1,
    expectFail: ["s1.no-pm-data"],
  });
  c.push({ id: "bug-without-severity", stage: 1, caseId: "BUG-114", files: edit({ "BUG-114-1-context.md": BUG_CONTEXT }, "BUG-114-1-context.md", [{ find: "Severity: high\n", replace: "" }]), reply: "Saved", expectFail: ["s1.bug-fields"] });

  // ── stage 2 ────────────────────────────────────────────────────────────────
  // The eval's own TASK-114 chain: the case's expected (goal, context_requirements) applies and must be satisfied.
  c.push({ id: "base-114", stage: 2, caseId: "TASK-114", files: stage2Base, reply: GOOD_REPLY_2, caseExpected: true, expectFail: [], expectPass: ["all"] });
  c.push({ id: "expected-context-count-wrong", stage: 2, caseId: "TASK-114", files: stage2Base, reply: GOOD_REPLY_2, expected: { context_requirements: 4 }, expectFail: ["s2.structure"] });
  c.push({ id: "expected-goal-wrong", stage: 2, caseId: "TASK-114", files: stage2Base, reply: GOOD_REPLY_2, expected: { goal: "Something the context does not say." }, expectFail: ["s2.structure"] });
  c.push({ id: "gate-base", stage: 2, caseId: "TASK-114", files: hookFixture("requirements", null, ""), reply: GOOD_REPLY_2, expectFail: [], expectPass: ["s2.structure"] });
  c.push({ id: "gate-goal-reworded", stage: 2, caseId: "TASK-114", files: hookFixture("requirements", "r3-goal-reworded", `${K}-2-requirements.md`), reply: GOOD_REPLY_2, expectFail: ["s2.structure"] });
  c.push({ id: "gate-missing-req", stage: 2, caseId: "TASK-114", files: hookFixture("requirements", "r2-missing-req", `${K}-2-requirements.md`), reply: GOOD_REPLY_2, expectFail: ["s2.structure"] });
  c.push({
    id: "requirement-reworded",
    stage: 2,
    caseId: "TASK-114",
    files: edit(stage2Base, REQ, [
      {
        find: "REQ-2: When a user clicks on a product name, they should be navigated to a dedicated product details page displaying full product information and maintaining consistent cart functionality.",
        replace: "REQ-2: Clicking a product name opens the product details page.",
      },
    ]),
    reply: GOOD_REPLY_2,
    expectFail: ["s2.text-unchanged"],
  });
  c.push({ id: "no-auto-decision", stage: 2, caseId: "TASK-114", files: stage2Base, reply: GOOD_REPLY_2.replace(/AUTO-DECISION:.*\n/, ""), expectFail: ["s2.auto-decision"] });
  c.push({ id: "problem-list-empty-group", stage: 2, caseId: "TASK-114", files: stage2Base, reply: "### Questions\n- the routing wording is vague\n\n### Risks\n\nAUTO-DECISION: 1 kept", expectFail: ["s2.problem-list"] });
  c.push({ id: "problem-entry-without-req-id", stage: 2, caseId: "TASK-114", files: stage2Base, reply: "### Questions\n- the routing wording is vague → ask\nAUTO-DECISION: 1 kept", expectFail: ["s2.problem-list"] });
  c.push({ id: "problem-list-missing", stage: 2, caseId: "TASK-114", files: stage2Base, reply: "Looks fine.\nAUTO-DECISION: 0 grooming questions left unanswered → requirements kept as in the context", expectFail: ["s2.problem-list"] });

  // ── stage 3 ────────────────────────────────────────────────────────────────
  const t3 = `${K}-3-checklist.md`;
  // The eval's own TASK-112 chain: the stage 3 input plus the checklist that the real stage 3 wrote (= the stage 4 input).
  const chain3: Files = {
    "TASK-112-2-requirements.md": evalInput("expl1-3-qa-checklist", "TASK-112", "TASK-112-2-requirements.md"),
    "TASK-112-3-checklist.md": evalInput("expl1-4-qa-test-cases", "TASK-112", "TASK-112-3-checklist.md"),
  };
  c.push({ id: "chain-112", stage: 3, caseId: "TASK-112", files: chain3, caseExpected: true, expectFail: [], expectPass: ["s3.structure"] });
  c.push({ id: "expected-reqs-wrong", stage: 3, caseId: "TASK-112", files: chain3, expected: { reqs: ["REQ-1", "REQ-2"] }, expectFail: ["s3.structure"] });
  c.push({ id: "gate-base", stage: 3, caseId: "TASK-114", files: s3, expectFail: [], expectPass: ["all"] });
  c.push({ id: "gate-missing-heading", stage: 3, caseId: "TASK-114", files: hookFixture("checklist", "c2-missing-heading", t3), expectFail: ["s3.structure"] });
  c.push({ id: "gate-empty-heading", stage: 3, caseId: "TASK-114", files: hookFixture("checklist", "c3-empty-heading", t3), expectFail: ["s3.structure"] });
  c.push({
    id: "forbidden-word",
    stage: 3,
    caseId: "TASK-114",
    files: edit(s3, t3, [{ find: "A non-empty description text is displayed on the product details page", replace: "A non-empty description text is displayed correctly on the product details page" }]),
    expectFail: ["s3.forbidden-words"],
  });
  c.push({
    id: "two-statements",
    stage: 3,
    caseId: "TASK-114",
    files: edit(s3, t3, [{ find: "A non-empty description text is displayed on the product details page", replace: "A non-empty description text is displayed on the product details page. The text is not truncated" }]),
    expectFail: ["s3.one-per-line"],
  });
  c.push({
    id: "dependent-check",
    stage: 3,
    caseId: "TASK-114",
    files: edit(s3, t3, [{ find: "- [ ] REQ-5.1: The price is displayed on the product details page", replace: "- [ ] REQ-5.1: After performing REQ-5.2 the price is displayed on the product details page" }]),
    expectFail: ["s3.independent"],
  });
  c.push({
    id: "check-without-id",
    stage: 3,
    caseId: "TASK-114",
    files: edit(s3, t3, [{ find: "- [ ] REQ-3.2: The product name", replace: "- [ ] The product name" }]),
    expectFail: ["s3.no-orphan-check"],
  });

  // ── stage 4 ────────────────────────────────────────────────────────────────
  const t4 = `${K}-4-test-cases.md`;
  // The gate fixture is a different TASK-114 chain than the eval inputs, so its ground truth is stated here.
  const gateReqs = [...s4[CHK]!.matchAll(/^### (REQ-[^:\s]+):/gm)].map((m) => m[1]!);
  c.push({ id: "gate-base", stage: 4, caseId: "TASK-114", files: s4, expectFail: [], expectPass: ["all"] });
  c.push({ id: "expected-match", stage: 4, caseId: "TASK-114", files: s4, expected: { reqs: gateReqs, min_test_cases: 25 }, expectFail: [], expectPass: ["s4.structure"] });
  c.push({ id: "expected-reqs-wrong", stage: 4, caseId: "TASK-114", files: s4, expected: { reqs: ["REQ-1", "REQ-2"] }, expectFail: ["s4.structure"] });
  c.push({ id: "expected-too-few-test-cases", stage: 4, caseId: "TASK-114", files: s4, expected: { min_test_cases: 26 }, expectFail: ["s4.structure"] });
  c.push({ id: "gate-missing-section", stage: 4, caseId: "TASK-114", files: hookFixture("test-cases", "tc2-missing-section", t4), expectFail: ["s4.structure"] });
  c.push({ id: "gate-unfinished", stage: 4, caseId: "TASK-114", files: edit(s4, t4, [{ find: "## Statistics", replace: "Statistics:" }]), expectFail: ["s4.structure"] });
  c.push({ id: "statistics-wrong-total", stage: 4, caseId: "TASK-114", files: edit(s4, t4, [{ find: "Total number of test cases: 25", replace: "Total number of test cases: 24" }]), expectFail: ["s4.statistics"] });
  c.push({
    id: "verify-that-name",
    stage: 4,
    caseId: "TASK-114",
    files: edit(s4, t4, [{ find: "### TC-REQ-1.1: Clicking a product name opens the product details page", replace: "### TC-REQ-1.1: Verify that clicking a product name opens the product details page" }]),
    expectFail: ["s4.scenario-names"],
  });
  c.push({
    id: "placeholder-data",
    stage: 4,
    caseId: "TASK-114",
    files: edit(s4, t4, [{ find: "| 1 | Click the name of a product in the product list | Product A [test data] |", replace: "| 1 | Click the name of a product in the product list | <product name> |" }]),
    expectFail: ["s4.no-placeholders"],
  });
  c.push({
    id: "vague-expected",
    stage: 4,
    caseId: "TASK-114",
    files: edit(s4, t4, [{ find: "Compare the name on the details page with the name noted on the inventory page | — | The names are identical |", replace: "Compare the name on the details page with the name noted on the inventory page | — | The names match correctly |" }]),
    expectFail: ["s4.vague-expected"],
  });
  c.push({
    id: "structural-note-missing",
    stage: 4,
    caseId: "TASK-114",
    files: edit(s4, t4, [{ find: "> ℹ️ Structural requirement (presence of a non-empty description). Covered by the checklist (REQ-4.1); no test case generated.", replace: "Covered by the checklist." }]),
    expectFail: ["s4.structural-note"],
  });
  c.push({
    id: "assertion-in-step",
    stage: 4,
    caseId: "TASK-114",
    files: edit(s4, t4, [{ find: "| 1 | Click the name of a product in the product list |", replace: "| 1 | Verify that the name of a product in the product list is clickable |" }]),
    expectFail: ["s4.steps-mechanical"],
  });
  c.push({
    id: "no-precondition",
    stage: 4,
    caseId: "TASK-114",
    files: edit(s4, t4, [{ find: "**Precondition:** The inventory page is open, the cart is empty", replace: "**Precondition:**" }]),
    expectFail: ["s4.precondition"],
  });
  return c;
}

/** Gate fixtures of the real stage 4 reviewer: tc6-* are labelled semantic defects the reviewer must catch (--real only). */
export interface RealCase {
  id: string;
  files: Files;
  expectReviewer: "PASS" | "FAIL";
}

export function realReviewerCases(): RealCase[] {
  const out: RealCase[] = [{ id: "_base", files: hookFixture("test-cases", null, ""), expectReviewer: "PASS" }];
  const root = path.join(HOOK_FIXTURES, "test-cases");
  for (const name of fs.readdirSync(root).filter((n) => n.startsWith("tc6-"))) {
    const spec = JSON.parse(fs.readFileSync(path.join(root, name, "case.json"), "utf8")) as { expect?: { real?: string[] } };
    if (!spec.expect?.real?.includes("BLOCK")) continue;
    out.push({ id: name, files: hookFixture("test-cases", name, `${K}-4-test-cases.md`), expectReviewer: "FAIL" });
  }
  return out;
}
