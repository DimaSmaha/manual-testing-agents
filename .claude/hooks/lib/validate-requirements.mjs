// Feedback loop 1: <ISSUEKEY>-2-requirements.md (stage 2, expl1-2-requirements-grooming) against the ground truth
// <ISSUEKEY>-1-context.md (stage 1) in the same folder.
//
// Library: validateArtifact(absPath) → { errors, warnings, unverified?, source } — the interface artifact-gate.mjs calls
// CLI:     node .claude/hooks/lib/validate-requirements.mjs <path/to/<KEY>-2-requirements.md>
//          → "PASS" (+ "note: …" lines), exit 0 | one error per line, exit 1 | "UNVERIFIED: …", exit 0
//
// What is checked (deterministic; the WORDING of requirements is not compared — grooming may rewrite, extend,
// split and add after the user agrees, so only the count and the numbering are checked):
//   - "## Goal" is copied from the context file unchanged (whitespace / quote style may differ).
//   - Context requirements = the bullets of "## Requirements", then of "## Additional requirements (from comments)".
//     With N of them, every k in 1..N has REQ-k or sub-items REQ-ka, REQ-kb…, and no REQ number is above N.
//   - Every "## Requirements" bullet starts with "REQ-<n>[a-z]: ", has text, no id twice, ids in ascending order.
// Feedback rule (from the reference gate): one note per problem, one fix per note.
// Test cases: .claude/hooks/test/run-artifact-gate-cases.mjs --artifact requirements (fixtures/requirements/).

import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { toLines, section, sectionText, bullets, parseReqs, reqOrder, issueKeyOf, norm, trunc, readOrNull } from "./expl1-markdown.mjs";

const SUFFIX = "2-requirements.md";
const ADDITIONAL = /^additional requirements\b/i;

/** @returns {{ errors: string[], warnings: string[], unverified?: string, source?: string }} */
export function validateArtifact(absPath) {
  const name = basename(absPath);
  const raw = readOrNull(absPath);
  if (raw === null) return { errors: [`${name}: file not found at ${absPath}`], warnings: [] };

  const key = issueKeyOf(name, SUFFIX);
  if (!key) return { errors: [], warnings: [], unverified: `${name} is not named <ISSUEKEY>-${SUFFIX}, so its context file is unknown` };
  const ctxName = `${key}-1-context.md`;
  const ctx = readOrNull(join(dirname(absPath), ctxName));
  if (ctx === null) {
    return {
      errors: [],
      warnings: [],
      unverified: `${ctxName} is not in the same folder as ${name}, so the Goal and the requirement count were not checked (never create the context file to get past this — it is written by expl1-1-task-context)`,
    };
  }
  return { ...validateRequirements(raw, ctx, { ctxName }), source: ctxName };
}

/**
 * @param {string} md   the requirements file (stage 2)
 * @param {string} ctx  the context file (stage 1)
 */
export function validateRequirements(md, ctx, { ctxName = "the context file" } = {}) {
  const errors = [];
  const warnings = [];
  const lines = toLines(md);
  const ctxLines = toLines(ctx);

  // ── Goal ───────────────────────────────────────────────────────────────────
  const ctxGoal = section(ctxLines, "Goal");
  const goal = section(lines, "Goal");
  const want = sectionText(ctxGoal);
  if (!ctxGoal.found || want === "") {
    warnings.push(`${ctxName} has no "## Goal" text → Goal not checked`);
  } else if (!goal.found) {
    errors.push(`"## Goal" section is missing → add "## Goal" above "## Requirements" with the Goal of ${ctxName} copied unchanged: ${JSON.stringify(want)}`);
  } else if (sectionText(goal) !== want) {
    const got = sectionText(goal);
    errors.push(
      got === ""
        ? `"## Goal" (line ${goal.start - 1}) is empty → copy the Goal of ${ctxName} unchanged: ${JSON.stringify(want)}`
        : `"## Goal" (line ${goal.start - 1}) differs from the Goal of ${ctxName} → copy it unchanged (do not reword or shorten it): ${JSON.stringify(want)}`,
    );
  }

  // ── Requirements: structure ────────────────────────────────────────────────
  const items = [...bullets(section(ctxLines, "Requirements")), ...bullets(section(ctxLines, ADDITIONAL))];
  const n = items.length;
  const sec = section(lines, "Requirements");
  if (!sec.found) {
    errors.push(`"## Requirements" section is missing → add it with one "- REQ-<k>: <text>" bullet per requirement of ${ctxName} (${n})`);
    return { errors, warnings };
  }
  const { reqs, malformed } = parseReqs(sec);
  if (reqs.length === 0 && malformed.length === 0) {
    errors.push(`"## Requirements" (line ${sec.start - 1}) has no "- REQ-<k>: <text>" bullets → add one per requirement of ${ctxName} (${n})`);
    return { errors, warnings };
  }

  const bases = new Set(reqs.map((r) => r.base));
  const claimed = new Set(); // context numbers a malformed bullet stands in for (no separate "missing" note)

  // A bullet without an id: point at the number it most likely is (the free slot after the REQ above it).
  const all = [...reqs.map((r) => ({ ...r, ok: true })), ...malformed.map((m) => ({ ...m, ok: false }))].sort((a, b) => a.line - b.line);
  let prevBase = 0;
  for (const b of all) {
    if (b.ok) {
      prevBase = b.base;
      continue;
    }
    const k = prevBase + 1;
    if (n > 0 && k <= n && !bases.has(k) && !claimed.has(k)) {
      claimed.add(k);
      prevBase = k;
      errors.push(`line ${b.line}: ${JSON.stringify(trunc(b.text))} has no REQ id; it stands where REQ-${k} belongs → start it with "REQ-${k}: "`);
    } else {
      errors.push(`line ${b.line}: ${JSON.stringify(trunc(b.text))} has no REQ id → start it with "REQ-<k>: " (k = its number in ${ctxName}, sub-items REQ-<k>a, REQ-<k>b), or remove it if it is not a requirement`);
    }
  }

  for (const r of reqs) if (r.text === "") errors.push(`${r.id} (line ${r.line}) has no text → write the requirement after "${r.id}: "`);

  // Duplicate ids.
  const byId = new Map();
  for (const r of reqs) byId.set(r.id, [...(byId.get(r.id) ?? []), r]);
  for (const [id, rs] of byId) {
    if (rs.length > 1) {
      errors.push(`${id} appears ${rs.length} times (lines ${rs.map((r) => r.line).join(", ")}) → keep one ${id}; a requirement split during grooming gets sub-items (${id}a, ${id}b), not the same id twice`);
    }
  }

  // Order (first offender only), duplicates skipped.
  const seen = new Set();
  let prev = null;
  for (const r of reqs) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    if (prev && reqOrder(r) < reqOrder(prev)) {
      errors.push(`${r.id} (line ${r.line}) comes after ${prev.id} → list the REQs in ascending order (REQ-1, REQ-2, REQ-2a, REQ-2b, REQ-3 …) — the order of the requirements in ${ctxName}`);
      break;
    }
    prev = r;
  }

  // ── Requirements: count against the context ────────────────────────────────
  if (n === 0) {
    warnings.push(`${ctxName} has no requirement bullets under "## Requirements" → the requirement count was not checked`);
    return { errors, warnings };
  }

  for (let k = 1; k <= n; k++) {
    if (bases.has(k) || claimed.has(k)) continue;
    const item = items[k - 1];
    const same = reqs.find((r) => r.text !== "" && r.text === norm(item.text));
    const hint = same ? ` ${same.id} has exactly this text — the numbering looks shifted; REQ-<k> must hold requirement #k of ${ctxName}.` : "";
    errors.push(
      `${ctxName} has ${n} requirements, but requirement #${k} has no REQ-${k} (or sub-items REQ-${k}a, REQ-${k}b) → add "- REQ-${k}: …" for it: ${JSON.stringify(trunc(item.text, 160))}.${hint} Do not drop or merge context requirements.`,
    );
  }

  const extras = [...new Set(reqs.filter((r) => r.base < 1 || r.base > n).map((r) => r.base))];
  for (const base of extras) {
    const ids = [...byId.keys()].filter((id) => byId.get(id)[0].base === base);
    errors.push(
      `${ids.join(", ")} (line ${byId.get(ids[0])[0].line}): ${ctxName} has ${n} requirements (REQ-1 … REQ-${n}), so there is no #${base} → remove it, or — if it was agreed during grooming as part of an existing requirement — make it a sub-item of that requirement (REQ-<k>a)`,
    );
  }

  return { errors, warnings };
}

// ── CLI ───────────────────────────────────────────────────────────────────────
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = process.argv[2];
  if (!target) {
    console.error("Usage: node .claude/hooks/lib/validate-requirements.mjs <path/to/<ISSUEKEY>-2-requirements.md>");
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
