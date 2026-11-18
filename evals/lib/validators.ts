// Structure validators of the evals (criteria s2.validator, s3.validator, s4.validator). Independent of the feedback
// loops: nothing here imports .claude/hooks, so a change to a hook validator can neither move an eval baseline nor hide
// a skill regression. The rules are the ones the stage output templates state; evals/self-test/gate-parity.ts compares
// these results with the hook validators on the self-test fixtures, so the two implementations cannot drift unnoticed.
//
// One note per problem, with the line number. The evals need pass/fail and a short evidence line, not fix hints.
import * as fs from "fs";
import * as path from "path";
import * as md from "./md";
import { bullets, issueKeyOf, norm, parseReqs, reqHeadings, reqRank, section, sectionText, toLines, trunc, uniqueById, type Req } from "./md";
import type { Expected } from "./types";

export type ValidatorKind = "requirements" | "checklist" | "test-cases";

export interface ValidatorResult {
  errors: string[];
  /** the ground-truth sibling file is missing or empty: nothing could be checked (a failure in the evals) */
  unverified?: string;
  /** stage 4 only: no `## Statistics` section yet, the file is unfinished */
  pending?: string;
}

/** The Markdown helpers the checks share (all in ./md). */
export function getMd(): typeof md {
  return md;
}

const SUFFIX: Record<ValidatorKind, string> = { requirements: "2-requirements.md", checklist: "3-checklist.md", "test-cases": "4-test-cases.md" };
const TRUTH: Record<ValidatorKind, string> = { requirements: "1-context.md", checklist: "2-requirements.md", "test-cases": "3-checklist.md" };

function readOrNull(p: string): string | null {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

/**
 * `expect` is the case's `expected` block. Whatever it states is checked in addition to what the input file implies, and a
 * disagreement between the two is reported as "case expects …" (the case file or the frozen input is wrong).
 */
export function validate(kind: ValidatorKind, absPath: string, expect: Expected = {}): ValidatorResult {
  const name = path.basename(absPath);
  const text = readOrNull(absPath);
  if (text === null) return { errors: [`${name}: file not found`] };
  const key = issueKeyOf(name, SUFFIX[kind]);
  if (!key) return { errors: [], unverified: `${name} is not named <ISSUEKEY>-${SUFFIX[kind]}` };
  const truthName = `${key}-${TRUTH[kind]}`;
  const truth = readOrNull(path.join(path.dirname(absPath), truthName));
  if (truth === null) return { errors: [], unverified: `${truthName} is not in the run folder` };
  switch (kind) {
    case "requirements":
      return { errors: requirementsErrors(text, truth, truthName, expect) };
    case "checklist":
      return checklistResult(text, truth, truthName, expect);
    case "test-cases":
      return testCasesResult(text, truth, truthName, expect);
  }
}

// ── stage 2: requirements vs the context file ───────────────────────────────────────────────────

function requirementsErrors(text: string, context: string, ctxName: string, expect: Expected): string[] {
  const errors: string[] = [];
  const lines = toLines(text);
  const ctxLines = toLines(context);

  // Goal copied unchanged. The case may state the Goal text itself (expect.goal); it must match the input as well.
  const ctxGoal = sectionText(section(ctxLines, "Goal"));
  if (expect.goal !== undefined && norm(expect.goal) !== ctxGoal) errors.push(`case expects the Goal ${JSON.stringify(trunc(expect.goal, 60))}, but ${ctxName} has ${JSON.stringify(trunc(ctxGoal, 60))}`);
  const wantGoal = expect.goal !== undefined ? norm(expect.goal) : ctxGoal;
  if (wantGoal !== "") {
    const goal = section(lines, "Goal");
    if (!goal.found) errors.push(`"## Goal" is missing (it must be copied unchanged from ${ctxName})`);
    else if (sectionText(goal) !== wantGoal) errors.push(`"## Goal" (line ${goal.start - 1}) differs from the Goal of ${ctxName}`);
  }

  // One REQ per context requirement ("## Requirements" bullets, then "## Additional requirements (from comments)").
  const items = [...bullets(section(ctxLines, "Requirements")), ...bullets(section(ctxLines, /^additional requirements\b/i))];
  const n = items.length;
  if (expect.context_requirements !== undefined && expect.context_requirements !== n) errors.push(`case expects ${expect.context_requirements} context requirements, but ${ctxName} has ${n}`);
  const sec = section(lines, "Requirements");
  if (!sec.found) return [...errors, '"## Requirements" is missing'];
  const { reqs, malformed } = parseReqs(sec);
  if (reqs.length === 0 && malformed.length === 0) return [...errors, `"## Requirements" has no "- REQ-<k>: <text>" bullets (${ctxName} has ${n})`];

  for (const b of malformed) errors.push(`line ${b.line}: ${JSON.stringify(trunc(b.text, 60))} has no REQ id`);
  for (const r of reqs) if (r.text === "") errors.push(`${r.id} (line ${r.line}) has no text`);

  const byId = new Map<string, Req[]>();
  for (const r of reqs) byId.set(r.id, [...(byId.get(r.id) ?? []), r]);
  for (const [id, list] of byId) if (list.length > 1) errors.push(`${id} appears ${list.length} times (lines ${list.map((r) => r.line).join(", ")})`);

  const ordered = uniqueById(reqs);
  for (let i = 1; i < ordered.length; i++) {
    if (reqRank(ordered[i]!) < reqRank(ordered[i - 1]!)) {
      errors.push(`${ordered[i]!.id} (line ${ordered[i]!.line}) comes after ${ordered[i - 1]!.id}: REQs must be in ascending order`);
      break;
    }
  }

  if (n > 0) {
    const bases = new Set(reqs.map((r) => r.base));
    for (let k = 1; k <= n; k++) if (!bases.has(k)) errors.push(`${ctxName} has ${n} requirements, but requirement #${k} has no REQ-${k} (or REQ-${k}a …): ${JSON.stringify(trunc(items[k - 1]!.text, 80))}`);
    for (const base of new Set(reqs.filter((r) => r.base < 1 || r.base > n).map((r) => r.base))) errors.push(`REQ-${base} exists, but ${ctxName} has only ${n} requirements`);
  }
  return errors;
}

// ── shared by stages 3 and 4: the headings must be the expected REQs, with exact text and in order ──

function compareHeadings(found: Req[], expected: Req[], mark: string, truthName: string): string[] {
  const errors: string[] = [];
  const have = new Map<string, Req[]>();
  for (const h of found) have.set(h.id, [...(have.get(h.id) ?? []), h]);
  const want = new Map(expected.map((r) => [r.id, r]));
  for (const [id, list] of have) {
    if (list.length > 1) errors.push(`${mark} ${id} appears ${list.length} times (lines ${list.map((h) => h.line).join(", ")})`);
    const w = want.get(id);
    if (!w) errors.push(`${mark} ${id} (line ${list[0]!.line}) is not a requirement in ${truthName}`);
    else if (list[0]!.text !== w.text) errors.push(`${mark} ${id} (line ${list[0]!.line}) text differs from ${truthName}: want ${JSON.stringify(trunc(w.text, 80))}, got ${JSON.stringify(trunc(list[0]!.text, 80))}`);
  }
  for (const r of expected) if (!have.has(r.id)) errors.push(`${r.id} of ${truthName} has no ${mark} heading`);
  const rank = new Map(expected.map((r, i) => [r.id, i]));
  const order = uniqueById(found).filter((h) => rank.has(h.id));
  for (let i = 1; i < order.length; i++) {
    if (rank.get(order[i]!.id)! < rank.get(order[i - 1]!.id)!) {
      errors.push(`${mark} ${order[i]!.id} (line ${order[i]!.line}) comes after ${order[i - 1]!.id}: the order of ${truthName} is not kept`);
      break;
    }
  }
  return errors;
}

/** The case's REQ list against the ids the input lists (a mismatch means the case file or the frozen input is wrong). */
function reqListErrors(expect: Expected, expected: Req[], truthName: string): string[] {
  if (!expect.reqs) return [];
  const got = expected.map((r) => r.id);
  return got.length === expect.reqs.length && got.every((id, i) => id === expect.reqs![i]) ? [] : [`case expects the REQs [${expect.reqs.join(", ")}], but ${truthName} lists [${got.join(", ")}]`];
}

// ── stage 3: checklist vs the requirements file ─────────────────────────────────────────────────

const CHECK_LINE = /^\s*[-*+]\s+(?:\[[ xX]\]\s+)?(.*)$/;
const CHECKBOX = /^\s*[-*+]\s+\[[ xX]\]/;
const CHECK_ID = /^(?:\*\*)?REQ-(\d+)([a-zA-Z])?\.(\d+)(?:\*\*)?\s*:/;

function checklistResult(text: string, requirements: string, reqName: string, expect: Expected): ValidatorResult {
  const expected = uniqueById(parseReqs(section(toLines(requirements), "Requirements")).reqs);
  if (expected.length === 0) return { errors: [], unverified: `${reqName} has no REQ bullets` };
  const errors: string[] = reqListErrors(expect, expected, reqName);
  const lines = toLines(text);
  const sec = section(lines, "Checklist");
  if (!sec.found) errors.push('"## Checklist" is missing');
  const body = sec.found ? sec.lines : lines;
  const first = sec.found ? sec.start : 1;

  interface Group extends Req {
    checks: { id: string; n: number }[];
  }
  const groups: Group[] = [];
  let cur: Group | null = null;
  body.forEach((l, i) => {
    const line = first + i;
    const h = /^###\s+(.*?)\s*$/.exec(l);
    if (h) {
      const heads = reqHeadings([l], 3);
      cur = heads.length ? { ...heads[0]!, line, checks: [] } : null;
      if (cur) groups.push(cur);
      return;
    }
    const c = CHECK_LINE.exec(l);
    if (!c) return;
    const id = CHECK_ID.exec(c[1]!);
    if (!id) {
      if (CHECKBOX.test(l)) errors.push(`line ${line}: check ${JSON.stringify(trunc(c[1]!, 60))} has no REQ id`);
      return;
    }
    const check = { id: `REQ-${Number(id[1])}${(id[2] ?? "").toLowerCase()}`, n: Number(id[3]) };
    if (!cur) errors.push(`line ${line}: check ${check.id}.${check.n} is not under a "### REQ-<id>: <text>" heading`);
    else (cur as Group).checks.push(check);
  });

  if (groups.length === 0) return { errors: [...errors, `no "### REQ-<id>: <text>" headings (${reqName} has ${expected.length} requirements)`] };
  errors.push(...compareHeadings(groups, expected, "###", reqName));
  for (const g of groups) {
    if (g.checks.length === 0) {
      errors.push(`### ${g.id} (line ${g.line}) has no checks`);
      continue;
    }
    for (const c of g.checks.filter((x) => x.id !== g.id)) errors.push(`check ${c.id}.${c.n} is under ### ${g.id}`);
    const nums = g.checks.filter((x) => x.id === g.id).map((x) => x.n);
    if (nums.some((n, i) => n !== i + 1)) errors.push(`### ${g.id} checks are numbered ${nums.map((n) => `${g.id}.${n}`).join(", ")}: expected ${g.id}.1 … ${g.id}.${nums.length} without gaps`);
  }
  return { errors };
}

// ── stage 4: test cases vs the checklist ─────────────────────────────────────────────────────────

const TC_HEADING = /^###\s+(?:\*\*)?TC-REQ-(\d+)([a-zA-Z])?\.(\d+)(?:\*\*)?\s*:?\s*(.*?)\s*$/;
const STEPS_HEADER = /^\s*\|.*\bstep\b.*\bexpected result\b.*\|\s*$/i;
const STEP_ROW = /^\s*\|\s*\d+\s*\|/;

function testCasesResult(text: string, checklist: string, chkName: string, expect: Expected): ValidatorResult {
  const lines = toLines(text);
  if (!section(lines, "Statistics").found) return { errors: [], pending: `no "## Statistics" section: the file is unfinished` };
  const expected = uniqueById(reqHeadings(toLines(checklist), 3));
  if (expected.length === 0) return { errors: [], unverified: `${chkName} has no "### REQ-<id>: <text>" headings` };

  interface Tc {
    id: string;
    reqId: string;
    n: number;
    line: number;
    table: boolean;
    steps: number;
  }
  interface Sec extends Req {
    tcs: Tc[];
    notes: number;
  }
  const errors: string[] = reqListErrors(expect, expected, chkName);
  const sections: Sec[] = reqHeadings(lines, 2).map((s) => ({ ...s, tcs: [], notes: 0 }));
  const byLine = new Map(sections.map((s) => [s.line, s]));
  let cur: Sec | null = null;
  let tc: Tc | null = null;
  lines.forEach((l, i) => {
    const line = i + 1;
    if (/^##\s/.test(l)) {
      cur = byLine.get(line) ?? null;
      tc = null;
      return;
    }
    const t = TC_HEADING.exec(l);
    if (t) {
      const reqId = `REQ-${Number(t[1])}${(t[2] ?? "").toLowerCase()}`;
      const made: Tc = { id: `TC-${reqId}.${Number(t[3])}`, reqId, n: Number(t[3]), line, table: false, steps: 0 };
      tc = made;
      if (cur) (cur as Sec).tcs.push(made);
      else errors.push(`line ${line}: test case ${made.id} is not under a "## REQ-<id>: <text>" section`);
      return;
    }
    if (/^###\s/.test(l)) {
      tc = null;
      return;
    }
    if (cur && !tc && /^\s*>\s*\S/.test(l)) (cur as Sec).notes += 1;
    const open = tc as Tc | null;
    if (open && STEPS_HEADER.test(l)) open.table = true;
    else if (open && open.table && STEP_ROW.test(l)) open.steps += 1;
  });

  if (sections.length === 0) return { errors: [...errors, `no "## REQ-<id>: <text>" sections (${chkName} has ${expected.length} requirements)`] };
  errors.push(...compareHeadings(sections, expected, "##", chkName));
  for (const s of sections) {
    if (s.tcs.length === 0) {
      if (s.notes === 0) errors.push(`## ${s.id} (line ${s.line}) has neither test cases nor a ">" note`);
      continue;
    }
    for (const t of s.tcs.filter((x) => x.reqId !== s.id)) errors.push(`test case ${t.id} (line ${t.line}) is under ## ${s.id}`);
    const nums = s.tcs.filter((x) => x.reqId === s.id).map((x) => x.n);
    if (nums.some((n, i) => n !== i + 1)) errors.push(`## ${s.id} test cases are numbered ${nums.map((n) => `TC-${s.id}.${n}`).join(", ")}: expected .1 … .${nums.length} without gaps`);
    for (const t of s.tcs) {
      if (!t.table) errors.push(`${t.id} (line ${t.line}) has no steps table`);
      else if (t.steps === 0) errors.push(`${t.id} (line ${t.line}) has a steps table without steps`);
    }
  }
  const total = sections.reduce((sum, s) => sum + s.tcs.length, 0);
  if (expect.min_test_cases !== undefined && total < expect.min_test_cases) errors.push(`${total} test cases, the case expects at least ${expect.min_test_cases}`);
  return { errors };
}
