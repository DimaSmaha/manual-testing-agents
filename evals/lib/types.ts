// Shared types of the expl1 skill evals (see evals/README.md).

export type Kind = "task" | "bug";

/** One line of evals/<skill>/cases.jsonl. */
export interface Case {
  id: string; // case id, also the folder name under inputs/ unless `input` says otherwise
  key: string; // TASK-<id> | BUG-<id>
  kind: Kind;
  input: string; // folder under evals/<skill>/inputs/
  expected: Expected;
  criteria: string[]; // criterion ids: deterministic (checks.ts) or LLM (grader.md)
  model?: string; // overrides the skill's pinned model
  tags: string[];
}

/**
 * Per-case ground truth the checks compare against. It is written in the case, so a reader sees what a case expects
 * without opening the frozen input. For stages 2-4 the structure check ALSO derives the same facts from the input
 * file; when the two disagree the case file (or the input) is wrong and the check fails with a "case expects" note.
 */
export interface Expected {
  stop?: boolean; // stage 1: the tracker record is empty -> `STOP:` and no context file
  type?: string; // stage 1: `Type:` header value
  title?: string; // stage 1: tracker title
  severity?: string; // stage 1, bugs
  requirement_count?: number | [number, number]; // stage 1: bullets under "## Requirements" (exact or [min, max])
  literals?: string[]; // stage 1: must appear verbatim (quotes/dashes normalised) somewhere in the context file
  context_requirements?: number; // stage 2: number of requirement bullets in the context input (REQ-1..N expected)
  goal?: string; // stage 2: the Goal text, copied unchanged into the requirements file
  min_problems?: number; // stage 2: at least this many problems listed in chat
  reqs?: string[]; // stages 3-4: the REQ ids the input lists, in order (one heading / section each)
  min_test_cases?: number; // stage 4: at least this many `### TC-REQ-…` test cases in total
  extra_sections?: boolean; // stage 1: Related context / Attachments / Additional requirements allowed
}

export interface CheckOutcome {
  pass: boolean;
  evidence: string;
}

/** Everything a check can look at. `dir` holds the seeded inputs and whatever the skill wrote. */
export interface CheckCtx {
  c: Case;
  key: string;
  dir: string; // absolute path of the (sandbox) run folder
  reply: string; // all assistant text of the trial
  finalReply: string; // the last assistant message / result text
  /** Text of a file in `dir`, or null. */
  read(name: string): string | null;
}

export interface Criterion {
  id: string;
  description: string;
  /** null = not applicable to this case. */
  run(ctx: CheckCtx): CheckOutcome | null;
}

export type CriterionKind = "deterministic" | "llm";

export interface CriterionResult {
  id: string;
  kind: CriterionKind;
  pass: boolean;
  evidence: string;
}

/** Same shape and names as the `billed` block of the run metrics (input, output, cache_read, cache_write, total). */
export interface Tokens {
  input: number;
  output: number;
  cache_read: number;
  cache_write: number;
  total: number;
}

export interface TrialResult {
  case: string;
  trial: number;
  error?: string; // trial could not run / timed out: counted as a fail, never retried
  criteria: CriterionResult[];
  pass: boolean; // no error and every deterministic criterion passed
  cost_usd: number;
  tokens: Tokens; // skill trial + judges
  skill_tokens: Tokens; // the skill trial alone
  turns: number;
  duration_ms: number; // the skill run alone
  total_ms?: number; // skill run + grading (checks and judges): the time the trial took end to end
  dir?: string; // where the trial folder was kept
}

export interface CaseResult {
  id: string;
  pass: boolean; // trials_passed >= threshold
  trials_passed: number;
  of: number;
}

export interface BaselineEntry {
  date: string;
  pass_rate: number;
  cases_hash: string;
  reason: string;
}

export interface Baseline {
  skill: string;
  cases_hash: string;
  last_run: string;
  total_cases: number;
  pass_rate: number;
  results: Record<string, CaseResult>;
  history: BaselineEntry[];
  changed: boolean;
  reason: string;
}

export interface StageDef {
  skill: string;
  n: 1 | 2 | 3 | 4;
  model: string;
  effort: "low" | "medium" | "high";
  thinking: boolean;
  maxTurns: number;
  artifact: string; // file-name suffix after `<KEY>-` of what the stage writes
  inputSuffix: string | null; // suffix of the frozen input file seeded into the run folder (null = stub tracker)
}
