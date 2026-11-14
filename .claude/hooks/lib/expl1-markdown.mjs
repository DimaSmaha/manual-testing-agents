// Markdown parsing shared by the expl1 artifact validators (validate-requirements.mjs, validate-checklist.mjs).
// Only the shapes the stage templates define are parsed:
//   stage 1  .claude/skills/expl1-1-task-context/references/output-template.md       (## Goal, ## Requirements bullets)
//   stage 2  .claude/skills/expl1-2-requirements-grooming/references/output-template.md   (- REQ-<n>[a-z]: <text>)
//   stage 3  .claude/skills/expl1-3-qa-checklist/references/output-template.md        (### REQ-<id>: <text> + - [ ] REQ-<id>.<n>: …)
// Changing one of those templates means changing the parser here and the fixtures in .claude/hooks/test/fixtures/.

import { readFileSync } from "node:fs";

/** Lines of a Markdown text (BOM stripped, CRLF or LF). */
export function toLines(md) {
  return String(md ?? "").replace(/^﻿/, "").split(/\r?\n/);
}

/** Whitespace collapsed, typographic quotes/dashes and non-breaking spaces unified — for "same text" comparisons. */
export function norm(s) {
  return String(s ?? "")
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The body of the level-2 section whose heading matches `heading` (a string = exact text, case-insensitive,
 * or a RegExp tested against the heading text), up to the next level-2 heading.
 * @returns {{ found: boolean, lines: string[], start: number }}  start = 1-based line number of the first body line
 */
export function section(lines, heading) {
  const test = (text) =>
    heading instanceof RegExp ? heading.test(text) : text.trim().toLowerCase() === String(heading).trim().toLowerCase();
  const at = lines.findIndex((l) => {
    const m = /^##\s+(.*?)\s*#*\s*$/.exec(l);
    return m !== null && test(m[1]);
  });
  if (at < 0) return { found: false, lines: [], start: 0 };
  let end = lines.length;
  for (let i = at + 1; i < lines.length; i++) {
    if (/^#{1,2}\s/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return { found: true, lines: lines.slice(at + 1, end), start: at + 2 };
}

/** Section text (body lines joined, normalised). */
export function sectionText(sec) {
  return norm(sec.lines.join(" "));
}

/**
 * Top-level bullets of a section body: one item per `- ` / `* ` / `+ ` line at column 0. Indented lines (wrapped
 * text, nested bullets) are folded into the item above. A non-indented non-bullet line ends the current item.
 * @returns {{ text: string, line: number }[]}
 */
export function bullets(sec) {
  const items = [];
  let cur = null;
  sec.lines.forEach((l, i) => {
    const m = /^[-*+]\s+(.*)$/.exec(l);
    if (m) {
      cur = { text: m[1], line: sec.start + i };
      items.push(cur);
    } else if (cur && /^\s+\S/.test(l)) {
      cur.text += " " + l.trim().replace(/^[-*+]\s+/, "");
    } else if (l.trim() !== "") {
      cur = null;
    }
  });
  return items.map((it) => ({ ...it, text: norm(it.text) }));
}

const REQ_ID = String.raw`(?:\*\*)?REQ-(\d+)([a-zA-Z])?(?:\*\*)?`;
const REQ_BULLET = new RegExp(String.raw`^${REQ_ID}\s*:(?:\*\*)?\s*(.*)$`);

/** Sort key of a REQ id: base number, then sub-item letter ("" < "a" < "b"). */
export const reqOrder = (r) => r.base * 100 + (r.suffix ? r.suffix.charCodeAt(0) - 96 : 0);

/**
 * `- REQ-<n>[a-z]: <text>` bullets of a section.
 * @returns {{ reqs: {id, base, suffix, text, line}[], malformed: {text, line}[] }}
 */
export function parseReqs(sec) {
  const reqs = [];
  const malformed = [];
  for (const b of bullets(sec)) {
    const m = REQ_BULLET.exec(b.text);
    if (!m) {
      malformed.push(b);
      continue;
    }
    const base = Number(m[1]);
    const suffix = (m[2] ?? "").toLowerCase();
    reqs.push({ id: `REQ-${base}${suffix}`, base, suffix, text: norm(m[3]), line: b.line });
  }
  return { reqs, malformed };
}

/** The REQ list of a stage 2 requirements file (its "## Requirements" section). */
export function requirementsOf(md) {
  const sec = section(toLines(md), "Requirements");
  return { found: sec.found, ...parseReqs(sec) };
}

/** `<ISSUEKEY>` of a stage artifact file name such as `TASK-114-2-requirements.md`, or null. */
export function issueKeyOf(fileName, suffix) {
  const m = /^((?:TASK|BUG)-\d+)-(.+)$/i.exec(fileName);
  if (!m || (suffix && m[2].toLowerCase() !== suffix.toLowerCase())) return null;
  return m[1].toUpperCase();
}

export function trunc(s, max = 100) {
  const t = norm(s);
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

export function readOrNull(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}
