/**
 * The key a skill run is reported under: `TASK-<id>` / `BUG-<id>` for the expl1-* pipeline, the
 * `eb-YYMMDD-HHMM` RUN_ID for the expl-bot-* flows. `unassigned` when nothing resolves.
 *
 * The mock read the ticket out of the subagent prompt and fell back to a state file. Neither exists here:
 *   1. Skill args — `/expl1-orchestrator TASK-112`, a tracker URL `…/tasks/112`, `--run eb-…`.
 *      For expl-bot-* / explorbot-* skills an issue key in the args is IGNORED: `--from <ISSUEKEY>` only
 *      reads that task's artifacts, the run itself is identified by its RUN_ID.
 *   2. The artifact paths the skill touched inside its window of the transcript:
 *      `.workflow-artifacts/<ISSUEKEY>/…` or `.workflow-artifacts/expl-bot/runs/<RUN_ID>/…`. Only
 *      assistant lines are scanned (tool-call inputs), never tool results — a skill's own SKILL.md quotes
 *      example names such as `TASK-112-1-context.md` and must not be mistaken for a ticket.
 *   3. The caller (report-model.mjs) falls back to the enclosing orchestrator's key, then the previous one.
 */

import { bareSkillName } from "./tracked-tools.mjs";

const RUN_ID = /\beb-\d{6}-\d{4}\b/;
const ISSUE = /\b((?:TASK|BUG)-\d+)\b/i;
const URL_ID = /\/(tasks|bugs)\/(\d+)\b/i;
const PATH_KEY =
  /\.workflow-artifacts[\\/]+((?:TASK|BUG)-\d+)[\\/]|expl-bot[\\/]+runs[\\/]+(eb-\d{6}-\d{4})[\\/]/;

const isExplBotSkill = (skill) => /^(expl-bot|explorbot)/.test(bareSkillName(skill));

export function keyFromArgs(args, skill = "") {
  const s = String(args ?? "");
  if (!s.trim()) return null;
  const run = s.match(RUN_ID);
  if (run) return run[0];
  if (isExplBotSkill(skill)) return null;
  const issue = s.match(ISSUE);
  if (issue) return issue[1].toUpperCase();
  const url = s.match(URL_ID);
  if (url) return `${url[1].toLowerCase() === "tasks" ? "TASK" : "BUG"}-${url[2]}`;
  return null;
}

/** First key an assistant line in `[fromMs, toMs)` names through an artifact path, or null. */
export function keyFromRecords(recs, fromMs, toMs) {
  if (!recs) return null;
  for (const e of recs) {
    if (e.r?.type !== "assistant" || e.t == null || e.t < fromMs || e.t >= toMs) continue;
    const m = e.raw.match(PATH_KEY);
    if (m) return m[1] || m[2];
  }
  return null;
}

export const UNASSIGNED = "unassigned";
