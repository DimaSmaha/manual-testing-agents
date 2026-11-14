// Runs a reviewer agent from .claude/agents/<name>.md as-is, through the CLI (ported from the "subagent" mode of
// user-story-to-test-case-agent-generator/.claude/hooks/lib/review-us-json-subagent.mjs):
//
//   claude -p "<prompt>" --agent <name> --setting-sources project --no-session-persistence
//          --output-format json --json-schema <schema>
//
// Claude Code applies the whole .md: body = system prompt (the rules), `tools`, `model`. The agent reads the files
// itself, so the prompt only names them. The verdict comes back as `structured_output` (the .md's `tools` list must
// include StructuredOutput). Why the CLI and not the Agent SDK's `agent` option: the SDK's bundled CLI applied the
// .md's tools/model but not its body, so the reviewer worked without its rules (finding of the reference repo).
//
// Recursion / side-effect safety: the nested session loads project settings, so its hooks run. EXPL1_REVIEW_CHILD=1
// makes artifact-gate.mjs and agent-metrics.mjs no-ops inside it (the reviewer has no Write tool anyway, and its
// turns must not land in the metrics of the task it reviews).
//
// CLAUDE_BIN overrides the binary (default `claude` on PATH). Test seam: a CLAUDE_BIN ending in .mjs/.js runs under
// node — the offline runner points it at .claude/hooks/test/fake-claude.mjs.

import { spawn } from "node:child_process";

export const REVIEW_TIMEOUT_MS = 240_000;

export const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    verdict: { type: "string", enum: ["PASS", "FAIL"] },
    notes: { type: "array", items: { type: "string" } },
  },
  required: ["verdict", "notes"],
  additionalProperties: false,
};

/**
 * @param {{ projectDir: string, agent: string, prompt: string, timeoutMs?: number }} args
 * @returns {Promise<{ verdict: "PASS"|"FAIL", notes: string[], cost_usd: number|null, duration_ms: number|null } | { error: string }>}
 *          `error` = the reviewer itself could not run (CLI missing, auth, timeout, bad output) — not a verdict.
 */
export async function reviewWithSubagent({ projectDir, agent, prompt, timeoutMs = REVIEW_TIMEOUT_MS }) {
  const args = [
    "-p", prompt,
    "--agent", agent,
    "--setting-sources", "project",
    "--no-session-persistence",
    "--output-format", "json",
    "--json-schema", JSON.stringify(OUTPUT_SCHEMA),
  ];
  const bin = process.env.CLAUDE_BIN || "claude";
  const [cmd, argv] = /\.(?:m?js|cjs)$/i.test(bin) ? [process.execPath, [bin, ...args]] : [bin, args];

  let run;
  try {
    run = await runCli(cmd, argv, projectDir, timeoutMs);
  } catch (e) {
    return { error: `reviewer could not start (${bin}): ${e.message}` };
  }
  if (run.timedOut) return { error: `reviewer timed out after ${Math.round(timeoutMs / 1000)}s` };

  let result;
  try {
    result = JSON.parse(run.stdout.trim().split(/\r?\n/).pop());
  } catch {
    return { error: `reviewer exited ${run.code} without JSON output: ${(run.stderr || run.stdout).trim().slice(-300)}` };
  }
  if (result.subtype !== "success" || result.is_error) {
    return { error: `reviewer ended with ${result.subtype}${result.result ? `: ${String(result.result).slice(0, 300)}` : ""}` };
  }
  const out = result.structured_output;
  if (out && (out.verdict === "PASS" || out.verdict === "FAIL") && Array.isArray(out.notes)) {
    return {
      verdict: out.verdict,
      notes: out.notes.map(String),
      cost_usd: typeof result.total_cost_usd === "number" ? result.total_cost_usd : null,
      duration_ms: typeof result.duration_ms === "number" ? result.duration_ms : null,
    };
  }
  return { error: `reviewer returned no structured verdict (is StructuredOutput in the agent's tools?): ${String(result.result).slice(0, 300)}` };
}

function runCli(cmd, args, cwd, timeoutMs) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, EXPL1_REVIEW_CHILD: "1" };
    const child = spawn(cmd, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut });
    });
  });
}
