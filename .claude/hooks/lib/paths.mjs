/**
 * Where the metrics live, resolved the same way by everything that touches them.
 *
 * Ported from the agent-metrics hooks of the suvore-qa-confa mock. The writer (hooks) and the reader
 * (report) must agree on the project root, so both go through `resolveProjectDir`.
 *
 * Layout (all under `.workflow-artifacts/`, which is git-ignored):
 *
 *   metrics/_events/<session_id>.jsonl        raw events the hooks append (skill starts, turns, subagents)
 *   metrics/_events/<session_id>.last-turn.json   sidecar: start of the most recent user turn
 *   metrics/_diagnostics.jsonl                one line for every hook early return (capped)
 *
 * Nothing else is stored: costs are never written down, they are derived by the report from the
 * events and the transcripts the harness already keeps.
 */

import { existsSync } from "node:fs";
import path from "node:path";

/** Walk up from `start` looking for the repository root, so a cwd inside a subdirectory still works. */
export function findRepoRoot(start) {
  let dir = path.resolve(start);
  for (;;) {
    if (existsSync(path.join(dir, ".git"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** The project root. `payload` is a hook payload when there is one, `null` for a CLI caller. */
export function resolveProjectDir(payload = null) {
  return (
    process.env.CLAUDE_PROJECT_DIR ||
    (payload?.cwd ? findRepoRoot(payload.cwd) : null) ||
    findRepoRoot(process.cwd()) ||
    process.cwd()
  );
}

const safe = (id) => String(id).replace(/[^A-Za-z0-9_-]/g, "_");

export const metricsDir = (projectDir) => path.join(projectDir, ".workflow-artifacts", "metrics");
export const eventsDir = (projectDir) => path.join(metricsDir(projectDir), "_events");
export const eventsFile = (projectDir, sessionId) => path.join(eventsDir(projectDir), `${safe(sessionId)}.jsonl`);
export const sidecarFile = (projectDir, sessionId) =>
  path.join(eventsDir(projectDir), `${safe(sessionId)}.last-turn.json`);
export const diagnosticsFile = (projectDir) => path.join(metricsDir(projectDir), "_diagnostics.jsonl");
