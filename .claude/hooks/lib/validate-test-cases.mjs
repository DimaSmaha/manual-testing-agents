// Feedback loop 3, script layer: <ISSUEKEY>-4-test-cases.md (stage 4, expl1-4-qa-test-cases) against the ground truth
// <ISSUEKEY>-3-checklist.md (stage 3) in the same folder. The content review (coverage of every checklist check with its
// data and conditions, contradictions, invented behavior) is done afterwards by the reviewer subagent
// .claude/agents/expl1-test-cases-reviewer.md — artifact-gate.mjs calls it only when this layer passes.
//
// Library: validateArtifact(absPath) → { errors, warnings, unverified?, pending?, source, inputs }
// CLI:     node .claude/hooks/lib/validate-test-cases.mjs <path/to/<KEY>-4-test-cases.md>
//
// pending  — the file has no "## Statistics" section yet (the template's last section): the stage is still writing
//            it, so nothing is checked and the reviewer is not called.
// Checked (deterministic):
//   - Every "### REQ-<id>: <text>" of the checklist has one "## REQ-<id>: <text>" section with the same text, in the
//     same order; no section for a REQ the checklist does not have.
//   - Every section has test cases or a "> …" note (structural / needs clarification).
//   - Test cases are "### TC-REQ-<id>.<n>: <name>" with the section's id and n = 1, 2, 3… without gaps, each with a
//     steps table (| # | Step | Test data | Expected result |) holding at least one step.
// Test cases: .claude/hooks/test/run-artifact-gate-cases.mjs --artifact test-cases (fixtures/test-cases/).

import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { toLines, section, reqHeadings, issueKeyOf, readOrNull } from "./expl1-markdown.mjs";

const SUFFIX = "4-test-cases.md";
const TC_HEADING = /^###\s+(?:\*\*)?TC-REQ-(\d+)([a-zA-Z])?\.(\d+)(?:\*\*)?\s*:?\s*(.*?)\s*$/;
const STEPS_HEADER = /^\s*\|.*\bstep\b.*\bexpected result\b.*\|\s*$/i;
const STEP_ROW = /^\s*\|\s*\d+\s*\|/;

/** @returns {{ errors: string[], warnings: string[], unverified?: string, pending?: string, source?: string, inputs?: string[] }} */
export function validateArtifact(absPath) {
  const name = basename(absPath);
  const raw = readOrNull(absPath);
  if (raw === null) return { errors: [`${name}: file not found at ${absPath}`], warnings: [] };

  const key = issueKeyOf(name, SUFFIX);
  if (!key) return { errors: [], warnings: [], unverified: `${name} is not named <ISSUEKEY>-${SUFFIX}, so its checklist is unknown` };
  const chkName = `${key}-3-checklist.md`;
  const chkPath = join(dirname(absPath), chkName);
  const chk = readOrNull(chkPath);
  if (chk === null) {
    return {
      errors: [],
      warnings: [],
      unverified: `${chkName} is not in the same folder as ${name}, so the test cases were not checked (never create the checklist to get past this — it is written by expl1-3-qa-checklist)`,
    };
  }
  const lines = toLines(raw);
  if (!section(lines, "Statistics").found) {
    return { errors: [], warnings: [], pending: `${name} has no "## Statistics" section yet, so it is not finished — checked when it is`, source: chkName, inputs: [chkPath] };
  }
  const reqs = reqHeadings(toLines(chk), 3);
  if (reqs.length === 0) {
    return { errors: [], warnings: [], unverified: `${chkName} has no "### REQ-<id>: <text>" headings, so the test cases were not checked — re-run expl1-3-qa-checklist` };
  }
  return { ...validateTestCases(lines, reqs, { chkName }), source: chkName, inputs: [chkPath] };
}

/**
 * @param {string[]} lines  the test-cases file
 * @param {{id, base, suffix, text}[]} reqList  the "### REQ-<id>: <text>" headings of the checklist, in order
 */
export function validateTestCases(lines, reqList, { chkName = "the checklist" } = {}) {
  const errors = [];
  const warnings = [];

  const expected = [];
  const textOf = new Map();
  for (const r of reqList) {
    if (textOf.has(r.id)) continue;
    textOf.set(r.id, r.text);
    expected.push(r);
  }

  // ── parse: "## REQ-…" sections, their notes and "### TC-REQ-…" test cases ────────
  const sections = reqHeadings(lines, 2).map((s) => ({ ...s, tcs: [], notes: 0 }));
  const byLine = new Map(sections.map((s) => [s.line, s]));
  let cur = null; // current REQ section
  let tc = null; // current test case
  lines.forEach((l, i) => {
    const line = i + 1;
    if (/^##\s/.test(l)) {
      cur = byLine.get(line) ?? null; // "## Statistics" etc. end the section
      tc = null;
      return;
    }
    const t = TC_HEADING.exec(l);
    if (t) {
      const reqId = `REQ-${Number(t[1])}${(t[2] ?? "").toLowerCase()}`;
      tc = { id: `TC-${reqId}.${Number(t[3])}`, reqId, n: Number(t[3]), line, table: false, steps: 0 };
      if (cur) cur.tcs.push(tc);
      else errors.push(`line ${line}: test case ${tc.id} is not under a "## REQ-<id>: <text>" section → move it under the section of ${reqId}`);
      return;
    }
    if (/^###\s/.test(l)) {
      tc = null;
      return;
    }
    if (cur && !tc && /^\s*>\s*\S/.test(l)) cur.notes += 1;
    if (tc && STEPS_HEADER.test(l)) tc.table = true;
    else if (tc && tc.table && STEP_ROW.test(l)) tc.steps += 1;
  });

  if (sections.length === 0) {
    errors.push(`no "## REQ-<id>: <text>" sections found → add one per requirement of ${chkName} (${expected.length}), in its order, each with its test cases`);
    return { errors, warnings };
  }

  // ── sections against the checklist ───────────────────────────────────────────────
  const sectionsOf = new Map();
  for (const s of sections) sectionsOf.set(s.id, [...(sectionsOf.get(s.id) ?? []), s]);
  const missing = expected.filter((r) => !sectionsOf.has(r.id));
  const paired = new Set();

  for (const [id, ss] of sectionsOf) {
    if (ss.length > 1) errors.push(`## ${id} appears ${ss.length} times (lines ${ss.map((s) => s.line).join(", ")}) → keep one ${id} section with all its test cases`);
    const s = ss[0];
    if (textOf.has(id)) {
      const want = textOf.get(id);
      if (s.text !== want) {
        errors.push(`## ${id} (line ${s.line}) text differs from ${id} in ${chkName} → replace the heading with exactly: "## ${id}: ${want}" (copy the requirement text, do not reword it)`);
      }
      continue;
    }
    const byText = missing.find((r) => !paired.has(r.id) && r.text === s.text);
    if (byText) {
      paired.add(byText.id);
      errors.push(`## ${id} (line ${s.line}) is not in ${chkName}; its text is ${byText.id} → write it as "## ${byText.id}: ${byText.text}" and number its test cases TC-${byText.id}.1, TC-${byText.id}.2 …`);
    } else {
      errors.push(`## ${id} (line ${s.line}) is not a requirement in ${chkName} → remove this section and its test cases (test cases cover only the requirements of the checklist)`);
    }
  }

  for (const r of missing) {
    if (paired.has(r.id)) continue;
    const k = expected.indexOf(r);
    const after = expected.slice(0, k).reverse().find((p) => sectionsOf.has(p.id));
    errors.push(
      `${r.id} of ${chkName} has no section → add "## ${r.id}: ${r.text}" ${after ? `after the ${after.id} section` : "as the first section"}, with its test cases (or the structural / needs-clarification note if it has no behavioral checks)`,
    );
  }

  const rank = new Map(expected.map((r, i) => [r.id, i]));
  const seen = new Set();
  let prev = null;
  for (const s of sections) {
    if (!rank.has(s.id) || seen.has(s.id)) continue;
    seen.add(s.id);
    if (prev && rank.get(s.id) < rank.get(prev.id)) {
      errors.push(`## ${s.id} (line ${s.line}) comes after ## ${prev.id} → order the sections as the requirements appear in ${chkName}`);
      break;
    }
    prev = s;
  }

  // ── test cases per section ──────────────────────────────────────────────────────
  for (const s of sections) {
    if (s.tcs.length === 0) {
      if (s.notes === 0) {
        errors.push(`## ${s.id} (line ${s.line}) has no test cases and no note → add its test cases (### TC-${s.id}.1: …), or the "> ℹ️ Structural requirement …" / "> ⚠️ The requirement needs clarification …" note if that is what it is`);
      }
      continue;
    }
    for (const t of s.tcs.filter((t) => t.reqId !== s.id)) {
      errors.push(`line ${t.line}: test case ${t.id} is under ## ${s.id} → number it TC-${s.id}.<n>, or move it under ## ${t.reqId}`);
    }
    const nums = s.tcs.filter((t) => t.reqId === s.id).map((t) => t.n);
    if (nums.some((n, i) => n !== i + 1)) {
      errors.push(`## ${s.id} test cases are numbered ${nums.map((n) => `TC-${s.id}.${n}`).join(", ")} → number them TC-${s.id}.1 … TC-${s.id}.${nums.length} in order, without gaps`);
    }
    for (const t of s.tcs) {
      if (!t.table) errors.push(`${t.id} (line ${t.line}) has no steps table → add "| # | Step | Test data | Expected result |" with its steps`);
      else if (t.steps === 0) errors.push(`${t.id} (line ${t.line}) has a steps table without steps → add its numbered steps with test data and expected results`);
    }
  }

  return { errors, warnings };
}

// ── CLI ───────────────────────────────────────────────────────────────────────
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = process.argv[2];
  if (!target) {
    console.error("Usage: node .claude/hooks/lib/validate-test-cases.mjs <path/to/<ISSUEKEY>-4-test-cases.md>");
    process.exit(2);
  }
  const { errors, warnings, unverified, pending } = validateArtifact(resolve(target));
  if (unverified || pending) {
    console.log(unverified ? `UNVERIFIED: ${unverified}` : `PENDING: ${pending}`);
    process.exit(0);
  }
  if (errors.length === 0) console.log("PASS (script layer; the content is reviewed by .claude/agents/expl1-test-cases-reviewer.md)");
  for (const e of errors) console.log(`- ${e}`);
  for (const w of warnings) console.log(`note: ${w}`);
  process.exit(errors.length ? 1 : 0);
}
