// Markdown parsing for the evals. Independent of the feedback loops: nothing here imports .claude/hooks. The shapes parsed
// are the ones the stage output templates define (.claude/skills/expl1-*/references/output-template.md):
//   stage 1  `## Goal`, `## Requirements` bullets
//   stage 2  `- REQ-<n>[a-z]: <text>` under `## Requirements`
//   stage 3  `### REQ-<id>: <text>` headings with `- [ ] REQ-<id>.<n>: <check>` lines
//   stage 4  `## REQ-<id>: <text>` sections with `### TC-REQ-<id>.<n>: <name>` test cases
// Changing a template means changing this file, structure.ts and evals/self-test/.

export interface Section {
  found: boolean;
  lines: string[];
  /** 1-based line number of the first body line */
  start: number;
}

export interface Req {
  id: string; // REQ-3, REQ-3a
  base: number; // 3
  suffix: string; // "", "a"
  text: string;
  line: number; // 1-based
}

export function toLines(md: string): string[] {
  return String(md ?? "").replace(/^﻿/, "").split(/\r?\n/);
}

/** Whitespace collapsed, typographic quotes/dashes and non-breaking spaces unified: for "same text" comparisons. */
export function norm(s: string): string {
  return String(s ?? "")
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function trunc(s: string, max = 100): string {
  const t = norm(s);
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** Body of the first level-2 section whose heading matches (string: case-insensitive equality), up to the next `#`/`##`. */
export function section(lines: string[], heading: string | RegExp): Section {
  const matches = (text: string): boolean => (heading instanceof RegExp ? heading.test(text) : text.trim().toLowerCase() === heading.trim().toLowerCase());
  let at = -1;
  for (let i = 0; i < lines.length && at < 0; i++) {
    const m = /^##\s+(.*?)\s*#*\s*$/.exec(lines[i]!);
    if (m && matches(m[1]!)) at = i;
  }
  if (at < 0) return { found: false, lines: [], start: 0 };
  let end = lines.length;
  for (let i = at + 1; i < lines.length; i++) {
    if (/^#{1,2}\s/.test(lines[i]!)) {
      end = i;
      break;
    }
  }
  return { found: true, lines: lines.slice(at + 1, end), start: at + 2 };
}

export function sectionText(sec: Section): string {
  return norm(sec.lines.join(" "));
}

/** Top-level bullets (`-`, `*`, `+` at column 0) of a section; indented lines continue the bullet above. */
export function bullets(sec: Section): { text: string; line: number }[] {
  const out: { text: string; line: number }[] = [];
  let cur: { text: string; line: number } | null = null;
  sec.lines.forEach((l, i) => {
    const m = /^[-*+]\s+(.*)$/.exec(l);
    if (m) {
      cur = { text: m[1]!, line: sec.start + i };
      out.push(cur);
    } else if (cur && /^\s+\S/.test(l)) {
      cur.text += " " + l.trim().replace(/^[-*+]\s+/, "");
    } else if (l.trim() !== "") {
      cur = null;
    }
  });
  return out.map((b) => ({ ...b, text: norm(b.text) }));
}

// `REQ-3: text`, `REQ-3a: text`, optionally bold: `**REQ-3**: text`
const REQ_TEXT = /^(?:\*\*)?REQ-(\d+)([a-zA-Z])?(?:\*\*)?\s*:(?:\*\*)?\s*(.*)$/;

function toReq(text: string, line: number): Req | null {
  const m = REQ_TEXT.exec(text);
  if (!m) return null;
  const base = Number(m[1]);
  const suffix = (m[2] ?? "").toLowerCase();
  return { id: `REQ-${base}${suffix}`, base, suffix, text: norm(m[3]!), line };
}

/** Position of an id in the ascending order REQ-1, REQ-1a, REQ-1b, REQ-2 … */
export function reqRank(r: { base: number; suffix: string }): number {
  return r.base * 100 + (r.suffix ? r.suffix.charCodeAt(0) - 96 : 0);
}

/** `- REQ-<n>[a-z]: <text>` bullets of a section; the bullets that do not match are `malformed`. */
export function parseReqs(sec: Section): { reqs: Req[]; malformed: { text: string; line: number }[] } {
  const reqs: Req[] = [];
  const malformed: { text: string; line: number }[] = [];
  for (const b of bullets(sec)) {
    const r = toReq(b.text, b.line);
    if (r) reqs.push(r);
    else malformed.push(b);
  }
  return { reqs, malformed };
}

/** `<#…#> REQ-<id>: <text>` headings of exactly `level` hashes (2: `## REQ-…` test cases, 3: `### REQ-…` checklist). */
export function reqHeadings(lines: string[], level: number): Req[] {
  const head = new RegExp(`^#{${level}}\\s+(.*?)\\s*$`);
  const out: Req[] = [];
  lines.forEach((l, i) => {
    const h = head.exec(l);
    if (!h || h[1]!.startsWith("#")) return;
    const r = toReq(h[1]!, i + 1);
    if (r) out.push(r);
  });
  return out;
}

/** First occurrence of each id, in file order. */
export function uniqueById<T extends { id: string }>(list: T[]): T[] {
  const seen = new Set<string>();
  return list.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
}

/** `<ISSUEKEY>` of a file named `TASK-114-2-requirements.md` for the given suffix, or null. */
export function issueKeyOf(fileName: string, suffix: string): string | null {
  const m = /^((?:TASK|BUG)-\d+)-(.+)$/i.exec(fileName);
  return m && m[2]!.toLowerCase() === suffix.toLowerCase() ? m[1]!.toUpperCase() : null;
}
