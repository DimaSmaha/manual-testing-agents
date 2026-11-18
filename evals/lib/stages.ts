// Registry of the evaluated skills. Model and effort are each skill's recommended setting (its SKILL.md first line).
import * as fs from "fs";
import * as path from "path";
import type { Case, Criterion, StageDef } from "./types";

export const EVALS_DIR = path.resolve(__dirname, "..");
export const REPO_ROOT = path.resolve(EVALS_DIR, "..");

const SONNET = "claude-sonnet-5-5";
const OPUS = "claude-opus-5-5";

export const STAGES: StageDef[] = [
  { skill: "expl1-1-task-context", n: 1, model: SONNET, effort: "medium", thinking: false, maxTurns: 40, artifact: "1-context.md", inputSuffix: null },
  { skill: "expl1-2-requirements-grooming", n: 2, model: SONNET, effort: "high", thinking: true, maxTurns: 60, artifact: "2-requirements.md", inputSuffix: "1-context.md" },
  { skill: "expl1-3-qa-checklist", n: 3, model: SONNET, effort: "medium", thinking: false, maxTurns: 60, artifact: "3-checklist.md", inputSuffix: "2-requirements.md" },
  { skill: "expl1-4-qa-test-cases", n: 4, model: SONNET, effort: "high", thinking: false, maxTurns: 80, artifact: "4-test-cases.md", inputSuffix: "3-checklist.md" },
];

export function stageOf(skill: string): StageDef {
  const s = STAGES.find((x) => x.skill === skill);
  if (!s) throw new Error(`unknown skill "${skill}" (known: ${STAGES.map((x) => x.skill).join(", ")})`);
  return s;
}

export function skillDir(skill: string): string {
  return path.join(EVALS_DIR, skill);
}

export function loadCases(skill: string): Case[] {
  const file = path.join(skillDir(skill), "cases.jsonl");
  const cases = fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "")
    .map((l, i) => {
      try {
        return JSON.parse(l) as Case;
      } catch (e) {
        throw new Error(`${file} line ${i + 1}: ${(e as Error).message}`);
      }
    });
  const ids = new Set<string>();
  for (const c of cases) {
    if (ids.has(c.id)) throw new Error(`${file}: duplicate case id ${c.id}`);
    ids.add(c.id);
    if (!fs.existsSync(path.join(skillDir(skill), "inputs", c.input))) throw new Error(`${file}: case ${c.id} has no inputs/${c.input} folder`);
  }
  return cases;
}

/** Deterministic criteria of a skill (checks.ts). Loaded with require so tsx resolves the .ts file. */
export function loadCriteria(skill: string): Criterion[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(path.join(skillDir(skill), "checks")) as { criteria: Criterion[] };
  return mod.criteria;
}

export interface LlmCriterion {
  id: string;
  text: string;
}

/** LLM criteria of a skill: `### <id>` sections of grader.md. */
export function loadGrader(skill: string): LlmCriterion[] {
  const file = path.join(skillDir(skill), "grader.md");
  if (!fs.existsSync(file)) return [];
  const out: LlmCriterion[] = [];
  let cur: LlmCriterion | null = null;
  for (const l of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const h = /^###\s+(\S+)\s*$/.exec(l);
    if (h) {
      cur = { id: h[1]!, text: "" };
      out.push(cur);
    } else if (cur) cur.text += `${l}\n`;
  }
  return out.map((c) => ({ ...c, text: c.text.trim() }));
}

/** Criterion ids that belong to neither checks.ts nor grader.md nor the reviewer-backed ones. */
export const REVIEWER_CRITERIA: Record<string, { agent: string }> = {
  "s4.llm-reviewer": { agent: "expl1-test-cases-reviewer" },
};
