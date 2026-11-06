/**
 * Which tool calls the metrics hooks care about, and which skills are orchestrators.
 *
 * Ported from the mock's `subagent-tools.mjs`. The subagent tool has shipped under two names — `Task` in
 * older harness builds, `Agent` in current ones — and the mock lost its whole metrics log once because the
 * matcher and the guard knew only one of them. Both names live here, and an unrecognised tool that carries
 * a subagent-shaped payload writes a diagnostic instead of vanishing.
 *
 * New for this repository: stages are SKILLS launched with the `Skill` tool in the same session, so the
 * hooks also track `Skill` launches, and a small list of GROUP skills (the orchestrators) whose run is
 * reported as the overall result of the stages they launch.
 */

/** Every tool name under which the harness has launched a subagent. */
export const SUBAGENT_TOOLS = Object.freeze(["Task", "Agent"]);
/** The skill-launching tool. */
export const SKILL_TOOLS = Object.freeze(["Skill"]);

export const isSubagentTool = (toolName) => SUBAGENT_TOOLS.includes(toolName);
export const isSkillTool = (toolName) => SKILL_TOOLS.includes(toolName);

/** Skills that drive other skills. Their own turns are reported as "(own turns)"; stages are separate rows. */
export const GROUP_SKILLS = Object.freeze([
  "expl1-orchestrator",
  "expl-bot-orchestrator",
  "expl-bot-independent-orchestrator",
]);

/** `plugin:skill` and `skill` both resolve to the bare skill name. */
export const bareSkillName = (name) => String(name ?? "").replace(/^.*:/, "");
export const isGroupSkill = (name) => GROUP_SKILLS.includes(bareSkillName(name));

/** Whether a payload looks like a subagent launch regardless of what the tool is called. */
export function looksLikeSubagentLaunch(payload) {
  const input = payload?.tool_input;
  if (!input || typeof input !== "object") return false;
  return typeof input.subagent_type === "string";
}
