// Feedback loop 4, script layer: <ISSUEKEY>-8-web-testing.md (stage 8, expl1-8-web-testing) against the ground truth
// <ISSUEKEY>-4-test-cases.md (stage 4) in the same folder. Whether every row really was run on the live app and says
// what happened is judged afterwards by the reviewer subagent .claude/agents/expl1-web-testing-reviewer.md —
// artifact-gate.mjs calls it only when this layer passes.
//
// Library: validateArtifact(absPath) → { errors, warnings, unverified?, pending?, source, inputs, fixHint }
// CLI:     node .claude/hooks/lib/validate-web-testing.mjs <path/to/<KEY>-8-web-testing.md>
//
// pending  — the report has no "## Statistics" section yet (written last): the run is still going, so nothing is checked.
// Checked (deterministic): every "### TC-REQ-<id>.<n>" test case of the test-cases file — all of them, whatever their
// code-review status — has exactly one row in the "## Results" table, with an executed status: PASS, FAIL,
// FAIL CONFIRMED, FAIL REJECTED, BLOCKED or OBSERVATION (the result itself does not matter; NOT RUN, NOT COMPLETED,
// SKIPPED, N/A or an empty status do not count). No row for a test case the file does not have. IMPACT rows are ignored.
// Test cases: .claude/hooks/test/run-artifact-gate-cases.mjs --artifact web-testing (fixtures/web-testing/).

import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { toLines, section, firstTable, tcIdIn, issueKeyOf, trunc, readOrNull } from "./expl1-markdown.mjs";

const SUFFIX = "8-web-testing.md";
const TC_HEADING = /^###\s+(?:\*\*)?(TC-REQ-\d+[a-zA-Z]?\.\d+)(?:\*\*)?\s*:?\s*(.*?)\s*$/;
// Longest first, so "FAIL CONFIRMED" is not read as "FAIL".
export const EXECUTED_STATUSES = ["FAIL CONFIRMED", "FAIL REJECTED", "OBSERVATION", "BLOCKED", "PASS", "FAIL"];

/** @returns {{ errors: string[], warnings: string[], unverified?: string, pending?: string, source?: string, inputs?: string[], fixHint?: Function }} */
export function validateArtifact(absPath) {
  const name = basename(absPath);
  const raw = readOrNull(absPath);
  if (raw === null) return { errors: [`${name}: file not found at ${absPath}`], warnings: [] };

  const key = issueKeyOf(name, SUFFIX);
  if (!key) return { errors: [], warnings: [], unverified: `${name} is not named <ISSUEKEY>-${SUFFIX}, so its test-cases file is unknown` };
  const tcName = `${key}-4-test-cases.md`;
  const tcPath = join(dirname(absPath), tcName);
  const tcMd = readOrNull(tcPath);
  if (tcMd === null) {
    return {
      errors: [],
      warnings: [],
      unverified: `${tcName} is not in the same folder as ${name}, so the report was not checked (never create the test-cases file to get past this — it is written by expl1-4-qa-test-cases)`,
    };
  }
  const lines = toLines(raw);
  if (!section(lines, "Statistics").found) {
    return { errors: [], warnings: [], pending: `${name} has no "## Statistics" section yet, so the run is not finished — checked when it is`, source: tcName, inputs: [tcPath] };
  }
  const testCases = testCasesOf(tcMd);
  if (testCases.length === 0) {
    return { errors: [], warnings: [], unverified: `${tcName} has no "### TC-REQ-<id>.<n>: <name>" test cases, so the report was not checked` };
  }
  return { ...validateWebTesting(lines, testCases, { tcName }), source: tcName, inputs: [tcPath], fixHint };
}

/** "### TC-REQ-<id>.<n>: <name>" headings of a test-cases file, in order. */
export function testCasesOf(md) {
  return toLines(md)
    .map((l) => TC_HEADING.exec(l))
    .filter(Boolean)
    .map((m) => ({ id: tcIdIn(m[1]), name: m[2] }));
}

/** The executed status a cell starts with, or null (NOT RUN, NOT COMPLETED, SKIPPED, N/A, empty …). */
export function executedStatus(cell) {
  const s = String(cell ?? "").replace(/[*_`]/g, "").trim().toUpperCase();
  return EXECUTED_STATUSES.find((st) => s === st || s.startsWith(`${st} `) || s.startsWith(`${st}(`) || s.startsWith(`${st}:`) || s.startsWith(`${st},`)) ?? null;
}

/**
 * @param {string[]} lines  the report
 * @param {{ id: string, name: string }[]} testCases  every test case of the test-cases file, in order
 */
export function validateWebTesting(lines, testCases, { tcName = "the test-cases file" } = {}) {
  const errors = [];
  const warnings = [];

  const sec = section(lines, "Results");
  const table = sec.found ? firstTable(sec) : null;
  const col = (re) => table?.header.findIndex((h) => re.test(h.replace(/[*_`]/g, "").trim())) ?? -1;
  const tcCol = col(/^(tc|test case|id)\b/i);
  const statusCol = col(/^status\b/i);
  if (!table || tcCol < 0 || statusCol < 0) {
    errors.push(
      `${sec.found ? `"## Results" (line ${sec.start - 1}) has no table with "TC" and "Status" columns` : `"## Results" section is missing`} → add "## Results" with "| TC | Name | Source | Status | Comment |" and one row per test case of ${tcName} (${testCases.length})`,
    );
    return { errors, warnings };
  }

  const known = new Map(testCases.map((t) => [t.id, t]));
  const rowsOf = new Map();
  for (const r of table.rows) {
    const id = tcIdIn(r.cells[tcCol]);
    if (!id) continue; // IMPACT rows (IMP-<n>) and other items are not test cases
    rowsOf.set(id, [...(rowsOf.get(id) ?? []), r]);
  }

  for (const t of testCases) {
    const rows = rowsOf.get(t.id);
    if (!rows) {
      errors.push(`${t.id} (${JSON.stringify(trunc(t.name, 70))}) has no row in "## Results" → execute it in the live app and add its row with the status and what you saw`);
      continue;
    }
    if (rows.length > 1) errors.push(`${t.id} has ${rows.length} rows (lines ${rows.map((r) => r.line).join(", ")}) → keep one row per test case, with its actual result`);
    const status = rows[0].cells[statusCol] ?? "";
    if (!executedStatus(status)) {
      errors.push(
        `${t.id} (line ${rows[0].line}): status ${JSON.stringify(trunc(status, 40) || "(empty)")} means it was not executed → execute it in the live app and record its actual result (PASS, FAIL, FAIL CONFIRMED, FAIL REJECTED, BLOCKED or OBSERVATION — any result is fine)`,
      );
    }
  }

  for (const [id, rows] of rowsOf) {
    if (!known.has(id)) errors.push(`row ${id} (line ${rows[0].line}) is not a test case in ${tcName} → correct the id to the test case it ran, or remove the row`);
  }

  return { errors, warnings };
}

/** Loop-4 fix instructions (the default "fix the file in place" is not enough: missing rows mean browser work). */
function fixHint({ name, source }) {
  return [
    `Execute every test case named above in the live app (the open playwright-cli session) and update ${name} in place:`,
    `one row per test case of ${source} — all of them, whatever their code-review status — with its actual status and what you saw.`,
    `The result does not matter (PASS, FAIL, BLOCKED … are all fine); never write a result for a test case you did not run.`,
    `If something outside your control blocks a test case (login, data, a page that does not load), record it as BLOCKED with the reason.`,
    `If the user stopped the run, stop and tell the user which test cases are still not executed instead.`,
  ];
}

// ── CLI ───────────────────────────────────────────────────────────────────────
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = process.argv[2];
  if (!target) {
    console.error("Usage: node .claude/hooks/lib/validate-web-testing.mjs <path/to/<ISSUEKEY>-8-web-testing.md>");
    process.exit(2);
  }
  const { errors, warnings, unverified, pending } = validateArtifact(resolve(target));
  if (unverified || pending) {
    console.log(unverified ? `UNVERIFIED: ${unverified}` : `PENDING: ${pending}`);
    process.exit(0);
  }
  if (errors.length === 0) console.log("PASS (script layer; the content is reviewed by .claude/agents/expl1-web-testing-reviewer.md)");
  for (const e of errors) console.log(`- ${e}`);
  for (const w of warnings) console.log(`note: ${w}`);
  process.exit(errors.length ? 1 : 0);
}
