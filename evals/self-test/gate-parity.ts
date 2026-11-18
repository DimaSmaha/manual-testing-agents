// Parity between the evals' own structure validators (evals/lib/validators.ts) and the feedback-loop validators
// (.claude/hooks/lib/validate-*.mjs). The evals do not depend on the hooks; this self-test file is the one place that
// imports them, so the two implementations cannot drift apart unnoticed: on every self-test fixture they must agree on
// "any error / no error". When they disagree, one of the two has a bug or a template changed in only one of them.
import * as path from "path";
import { pathToFileURL } from "url";
import { REPO_ROOT } from "../lib/stages";
import { validate, type ValidatorKind } from "../lib/validators";

interface GateResult {
  errors: string[];
  unverified?: string;
  pending?: string;
}
type GateFn = (absPath: string) => GateResult;

const FILES: Record<ValidatorKind, { suffix: string; module: string }> = {
  requirements: { suffix: "2-requirements.md", module: "validate-requirements.mjs" },
  checklist: { suffix: "3-checklist.md", module: "validate-checklist.mjs" },
  "test-cases": { suffix: "4-test-cases.md", module: "validate-test-cases.mjs" },
};
const KIND_OF_STAGE: Record<number, ValidatorKind | undefined> = { 2: "requirements", 3: "checklist", 4: "test-cases" };

const gate = new Map<ValidatorKind, GateFn>();

async function gateValidator(kind: ValidatorKind): Promise<GateFn> {
  let fn = gate.get(kind);
  if (!fn) {
    const url = pathToFileURL(path.join(REPO_ROOT, ".claude", "hooks", "lib", FILES[kind].module)).href;
    fn = ((await import(url)) as { validateArtifact: GateFn }).validateArtifact;
    gate.set(kind, fn);
  }
  return fn;
}

/**
 * Compare both implementations on one materialized fixture folder.
 * @returns null when they agree (or when either one could not judge the file: unverified / unfinished), else a message.
 */
export async function compareWithGate(stage: number, dir: string, key: string): Promise<{ compared: boolean; problem: string | null }> {
  const kind = KIND_OF_STAGE[stage];
  if (!kind) return { compared: false, problem: null };
  const file = path.join(dir, `${key}-${FILES[kind].suffix}`);
  const mine = validate(kind, file);
  const theirs = (await gateValidator(kind))(file);
  if (mine.unverified || mine.pending || theirs.unverified || theirs.pending) return { compared: false, problem: null };
  const a = mine.errors.length > 0;
  const b = theirs.errors.length > 0;
  if (a === b) return { compared: true, problem: null };
  return {
    compared: true,
    problem: `evals validator ${a ? "FAILS" : "passes"} but the gate validator ${b ? "FAILS" : "passes"} ${kind}: evals [${mine.errors.slice(0, 2).join(" | ")}] gate [${theirs.errors.slice(0, 2).join(" | ")}]`,
  };
}
