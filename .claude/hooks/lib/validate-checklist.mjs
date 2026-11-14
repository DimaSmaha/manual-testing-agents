// Feedback loop 2: <ISSUEKEY>-3-checklist.md (stage 3, expl1-3-qa-checklist) against the ground truth
// <ISSUEKEY>-2-requirements.md (stage 2) in the same folder.
//
// Library: validateArtifact(absPath) → { errors, warnings, unverified?, source } — the interface artifact-gate.mjs calls
// CLI:     node .claude/hooks/lib/validate-checklist.mjs <path/to/<KEY>-3-checklist.md>
//          → "PASS" (+ "note: …" lines), exit 0 | one error per line, exit 1 | "UNVERIFIED: …", exit 0
//
// What is checked (deterministic):
//   - Every REQ of the requirements file has exactly one "### REQ-<id>: <text>" heading, in the same order, with the
//     requirement text exactly as written there (whitespace / quote style may differ); no heading for a REQ that
//     the requirements file does not have.
//   - Every heading has at least one check; checks are "- [ ] REQ-<id>.<n>: …" with the heading's id and n = 1, 2, 3…
//     without gaps; no check outside a REQ heading; no checkbox without an id.
// Feedback rule (from the reference gate): one note per problem, one fix per note.
// Test cases: .claude/hooks/test/run-artifact-gate-cases.mjs --artifact checklist (fixtures/checklist/).

import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { toLines, section, requirementsOf, issueKeyOf, norm, trunc, readOrNull } from "./expl1-markdown.mjs";

const SUFFIX = "3-checklist.md";
const HEADING = /^###\s+(.*?)\s*$/;
const REQ_HEADING = /^(?:\*\*)?REQ-(\d+)([a-zA-Z])?(?:\*\*)?\s*:(?:\*\*)?\s*(.*)$/;
const CHECK_LINE = /^\s*[-*+]\s+(?:\[[ xX]\]\s+)?(.*)$/;
const CHECKBOX = /^\s*[-*+]\s+\[[ xX]\]/;
const CHECK_ID = /^(?:\*\*)?REQ-(\d+)([a-zA-Z])?\.(\d+)(?:\*\*)?\s*:/;

/** @returns {{ errors: string[], warnings: string[], unverified?: string, source?: string }} */
export function validateArtifact(absPath) {
  const name = basename(absPath);
  const raw = readOrNull(absPath);
  if (raw === null) return { errors: [`${name}: file not found at ${absPath}`], warnings: [] };

  const key = issueKeyOf(name, SUFFIX);
  if (!key) return { errors: [], warnings: [], unverified: `${name} is not named <ISSUEKEY>-${SUFFIX}, so its requirements file is unknown` };
  const reqName = `${key}-2-requirements.md`;
  const reqMd = readOrNull(join(dirname(absPath), reqName));
  if (reqMd === null) {
    return {
      errors: [],
      warnings: [],
      unverified: `${reqName} is not in the same folder as ${name}, so the checklist headings were not checked (never create the requirements file to get past this — it is written by expl1-2-requirements-grooming)`,
    };
  }
  const { reqs } = requirementsOf(reqMd);
  if (reqs.length === 0) {
    return { errors: [], warnings: [], unverified: `${reqName} has no "- REQ-<k>: <text>" bullets under "## Requirements", so the checklist headings were not checked — re-run expl1-2-requirements-grooming` };
  }
  return { ...validateChecklist(raw, reqs, { reqName }), source: reqName };
}

/**
 * @param {string} md  the checklist file (stage 3)
 * @param {{id, base, suffix, text}[]} reqList  the REQs of the requirements file, in file order
 */
export function validateChecklist(md, reqList, { reqName = "the requirements file" } = {}) {
  const errors = [];
  const warnings = [];
  const lines = toLines(md);

  // Expected REQs (first occurrence of each id, in file order).
  const expected = [];
  const textOf = new Map();
  for (const r of reqList) {
    if (textOf.has(r.id)) continue;
    textOf.set(r.id, r.text);
    expected.push(r);
  }

  // ── parse headings and checks ──────────────────────────────────────────────
  const sec = section(lines, "Checklist");
  if (!sec.found) errors.push(`"## Checklist" section is missing → put the "### REQ-<id>: <text>" headings under one "## Checklist" heading`);
  const body = sec.found ? sec.lines : lines;
  const start = sec.found ? sec.start : 1;

  const groups = []; // { id, base, suffix, text, line, checks: [{ id, n, line }] }
  let cur = null; // current REQ group, or null (before the first heading / under a non-REQ heading)
  body.forEach((l, i) => {
    const line = start + i;
    const h = HEADING.exec(l);
    if (h) {
      const m = REQ_HEADING.exec(h[1]);
      if (m) {
        const base = Number(m[1]);
        const suffix = (m[2] ?? "").toLowerCase();
        cur = { id: `REQ-${base}${suffix}`, base, suffix, text: norm(m[3]), line, checks: [] };
        groups.push(cur);
      } else {
        cur = null;
      }
      return;
    }
    const c = CHECK_LINE.exec(l);
    if (!c) return;
    const id = CHECK_ID.exec(c[1]);
    if (!id) {
      // A checkbox without an id is a check that cannot be traced; a plain bullet may be a note.
      if (CHECKBOX.test(l)) errors.push(`line ${line}: check ${JSON.stringify(trunc(c[1]))} has no id → start it with "REQ-<id>.<n>: " (the id of the heading it is under)`);
      return;
    }
    const check = { id: `REQ-${Number(id[1])}${(id[2] ?? "").toLowerCase()}`, n: Number(id[3]), line };
    if (!cur) {
      errors.push(`line ${line}: check ${check.id}.${check.n} is not under a "### REQ-<id>: <text>" heading → move it under the heading of ${check.id}`);
      return;
    }
    cur.checks.push(check);
  });

  if (groups.length === 0) {
    errors.push(`no "### REQ-<id>: <text>" headings found → add one per requirement of ${reqName} (${expected.length}), in its order, each with its checks`);
    return { errors, warnings };
  }

  // ── headings against the requirements file ────────────────────────────────
  const headingsOf = new Map();
  for (const g of groups) headingsOf.set(g.id, [...(headingsOf.get(g.id) ?? []), g]);
  const missing = expected.filter((r) => !headingsOf.has(r.id));
  const pairedMissing = new Set();

  for (const [id, gs] of headingsOf) {
    if (gs.length > 1) {
      errors.push(`### ${id} appears ${gs.length} times (lines ${gs.map((g) => g.line).join(", ")}) → keep one ${id} heading and put all its checks under it`);
    }
    const g = gs[0];
    if (textOf.has(id)) {
      const want = textOf.get(id);
      if (g.text === want) continue;
      const other = expected.find((r) => r.id !== id && r.text === g.text);
      errors.push(
        other
          ? `### ${id} (line ${g.line}) has the text of ${other.id} → the ${id} heading must be exactly: "### ${id}: ${want}"`
          : `### ${id} (line ${g.line}) text differs from ${id} in ${reqName} → replace the heading with exactly: "### ${id}: ${want}" (copy the requirement text, do not reword it)`,
      );
      continue;
    }
    // Not a REQ of the requirements file. Same text as a missing REQ → wrong id; same base as missing sub-items → split.
    const byText = missing.find((r) => !pairedMissing.has(r.id) && r.text === g.text);
    const subs = missing.filter((r) => !pairedMissing.has(r.id) && r.base === g.base && r.id !== id);
    if (byText) {
      pairedMissing.add(byText.id);
      errors.push(`### ${id} (line ${g.line}) is not in ${reqName}; its text is ${byText.id} → write it as "### ${byText.id}: ${byText.text}" and number its checks ${byText.id}.1, ${byText.id}.2 …`);
    } else if (subs.length) {
      subs.forEach((r) => pairedMissing.add(r.id));
      errors.push(
        `### ${id} (line ${g.line}) is not in ${reqName}, which splits it into ${subs.map((r) => r.id).join(", ")} → replace it with one heading per sub-item, each with its own checks: ${subs.map((r) => `"### ${r.id}: ${r.text}"`).join(", ")}`,
      );
    } else {
      errors.push(`### ${id} (line ${g.line}) is not a requirement in ${reqName} → remove this heading and its checks (the checklist covers only the REQs of the requirements file)`);
    }
  }

  for (const r of missing) {
    if (pairedMissing.has(r.id)) continue;
    const k = expected.indexOf(r);
    const after = expected.slice(0, k).reverse().find((p) => headingsOf.has(p.id));
    errors.push(`${r.id} of ${reqName} has no heading → add "### ${r.id}: ${r.text}" with at least one check, ${after ? `after the ${after.id} section` : "as the first section"}`);
  }

  // Order of the known headings (first occurrence each), first offender only.
  const rank = new Map(expected.map((r, i) => [r.id, i]));
  const seen = new Set();
  let prev = null;
  for (const g of groups) {
    if (!rank.has(g.id) || seen.has(g.id)) continue;
    seen.add(g.id);
    if (prev && rank.get(g.id) < rank.get(prev.id)) {
      errors.push(`### ${g.id} (line ${g.line}) comes after ### ${prev.id} → order the headings as the REQs appear in ${reqName}`);
      break;
    }
    prev = g;
  }

  // ── checks per heading ────────────────────────────────────────────────────
  for (const g of groups) {
    if (g.checks.length === 0) {
      errors.push(`### ${g.id} (line ${g.line}) has no checks → add at least one "- [ ] ${g.id}.1: <check>"`);
      continue;
    }
    for (const c of g.checks.filter((c) => c.id !== g.id)) {
      errors.push(`line ${c.line}: check ${c.id}.${c.n} is under ### ${g.id} → number it ${g.id}.<n>, or move it under ### ${c.id}`);
    }
    const nums = g.checks.filter((c) => c.id === g.id).map((c) => c.n);
    if (nums.some((n, i) => n !== i + 1)) {
      errors.push(`### ${g.id} checks are numbered ${nums.map((n) => `${g.id}.${n}`).join(", ")} → number them ${g.id}.1 … ${g.id}.${nums.length} in order, without gaps`);
    }
  }

  return { errors, warnings };
}

// ── CLI ───────────────────────────────────────────────────────────────────────
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = process.argv[2];
  if (!target) {
    console.error("Usage: node .claude/hooks/lib/validate-checklist.mjs <path/to/<ISSUEKEY>-3-checklist.md>");
    process.exit(2);
  }
  const { errors, warnings, unverified } = validateArtifact(resolve(target));
  if (unverified) {
    console.log(`UNVERIFIED: ${unverified}`);
    process.exit(0);
  }
  if (errors.length === 0) console.log("PASS");
  for (const e of errors) console.log(`- ${e}`);
  for (const w of warnings) console.log(`note: ${w}`);
  process.exit(errors.length ? 1 : 0);
}
