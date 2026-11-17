// Deterministic criteria of stage 3 (expl1-3-qa-checklist). Base: the structure validator (lib/validators.ts). Extra: the wording rules of
// references/checklist-design-rules.md that a script can see (forbidden words, one check per line, independence).
import type { CheckCtx, Criterion } from "../lib/types";
import { artifactOf, artifactPath, fail, findWords, fromProblems, FORBIDDEN_WORDS } from "../lib/check-util";
import { getMd, validate } from "../lib/validators";

const SUFFIX = "3-checklist.md";
const CHECKBOX = /^\s*[-*+]\s+\[[ xX]\]\s+(.*)$/;
const CHECK_ID = /^(?:\*\*)?(REQ-\d+[a-z]?\.\d+)(?:\*\*)?\s*:\s*(.*)$/;

interface Check {
  id: string | null;
  text: string;
  line: number;
}

function checks(ctx: CheckCtx): Check[] | null {
  const md = artifactOf(ctx, SUFFIX);
  if (md === null) return null;
  const out: Check[] = [];
  getMd()
    .toLines(md)
    .forEach((l, i) => {
      const m = CHECKBOX.exec(l);
      if (!m) return;
      const id = CHECK_ID.exec(m[1]!);
      out.push({ id: id ? id[1]! : null, text: id ? id[2]!.trim() : m[1]!.trim(), line: i + 1 });
    });
  return out;
}

export const criteria: Criterion[] = [
  {
    id: "s3.structure",
    description: "Structure (lib/validators.ts): one heading per REQ of expected.reqs with exact text, in order, numbered checks",
    run(ctx) {
      if (artifactOf(ctx, SUFFIX) === null) return fail(`${ctx.key}-${SUFFIX} was not written`);
      const r = validate("checklist", artifactPath(ctx, SUFFIX), ctx.c.expected);
      if (r.unverified) return fail(`UNVERIFIED: ${r.unverified}`);
      return fromProblems(r.errors, "structure ok");
    },
  },
  {
    id: "s3.forbidden-words",
    description: "No forbidden vague word in a check (correctly, properly, if needed, several, quickly …)",
    run(ctx) {
      const list = checks(ctx);
      if (list === null) return fail(`${ctx.key}-${SUFFIX} was not written`);
      const problems = list.flatMap((c) => findWords(c.text, FORBIDDEN_WORDS).map((w) => `line ${c.line} ${c.id ?? ""}: "${w}"`));
      return fromProblems(problems, `${list.length} checks scanned`);
    },
  },
  {
    id: "s3.one-per-line",
    description: "One check per line: a check is one sentence, not a list of statements",
    run(ctx) {
      const list = checks(ctx);
      if (list === null) return fail(`${ctx.key}-${SUFFIX} was not written`);
      const problems = list
        .filter((c) => /;|[.!?]\s+[A-Z]/.test(c.text))
        .map((c) => `line ${c.line} ${c.id ?? ""}: several statements in one check (${JSON.stringify(c.text.slice(0, 70))})`);
      return fromProblems(problems);
    },
  },
  {
    id: "s3.independent",
    description: "No dependent check: a check does not refer to another check or to 'after performing …'",
    run(ctx) {
      const list = checks(ctx);
      if (list === null) return fail(`${ctx.key}-${SUFFIX} was not written`);
      const problems = list
        .filter((c) => /\bREQ-\d/.test(c.text) || /\b(after|following)\s+(performing|completing|doing|executing|step|the previous|check)\b/i.test(c.text) || /\bprevious check\b/i.test(c.text))
        .map((c) => `line ${c.line} ${c.id ?? ""}: depends on another check (${JSON.stringify(c.text.slice(0, 70))})`);
      return fromProblems(problems);
    },
  },
  {
    id: "s3.no-orphan-check",
    description: "Every checkbox is a check with a REQ id and text",
    run(ctx) {
      const list = checks(ctx);
      if (list === null) return fail(`${ctx.key}-${SUFFIX} was not written`);
      const problems = list.filter((c) => c.id === null || c.text === "").map((c) => `line ${c.line}: check without a REQ id or text (${JSON.stringify(c.text.slice(0, 60))})`);
      if (list.length === 0) problems.push("the checklist has no checks");
      return fromProblems(problems, `${list.length} checks, all with an id`);
    },
  },
];
