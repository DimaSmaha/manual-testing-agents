import type { CheckCtx, CheckOutcome } from "./types";

export const pass = (evidence = "ok"): CheckOutcome => ({ pass: true, evidence });
export const fail = (evidence: string): CheckOutcome => ({ pass: false, evidence });

/** `n` problems -> one failing outcome listing at most `max` of them. */
export function fromProblems(problems: string[], okText = "ok", max = 6): CheckOutcome {
  if (problems.length === 0) return pass(okText);
  const shown = problems.slice(0, max).join(" | ");
  return fail(problems.length > max ? `${shown} | … (+${problems.length - max} more)` : shown);
}

/** Text of the stage's artifact `<KEY>-<suffix>` in the run folder, or null. */
export function artifactOf(ctx: CheckCtx, suffix: string): string | null {
  return ctx.read(`${ctx.key}-${suffix}`);
}

/** Absolute path of an artifact in the run folder. */
export function artifactPath(ctx: CheckCtx, suffix: string): string {
  return `${ctx.dir.replace(/[\\/]+$/, "")}/${ctx.key}-${suffix}`;
}

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole-word, case-insensitive match of any phrase; returns the phrases found. */
export function findWords(text: string, words: string[]): string[] {
  return words.filter((w) => new RegExp(`(?<![\\w-])${escapeRegExp(w)}(?![\\w-])`, "i").test(text));
}

/** The words the stage 3 and stage 4 skills forbid in checks and expected results (checklist-design-rules.md). */
export const FORBIDDEN_WORDS = [
  "correctly",
  "properly",
  "appropriately",
  "appropriate",
  "relevant",
  "adequate",
  "adequately",
  "acceptable",
  "if needed",
  "if necessary",
  "several",
  "some",
  "enough",
  "quickly",
  "smoothly",
  "conveniently",
  "fast",
  "user-friendly",
  "looks good",
  "works fine",
  "should work",
  "as needed",
];
