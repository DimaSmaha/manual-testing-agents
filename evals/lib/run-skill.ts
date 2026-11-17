// One trial: run one stage skill through the Agent SDK in a sandbox run folder and capture what it wrote and said.
// Pattern copied from scripts/expl-bot-run.ts (query(), settingSources project, dontAsk + allowedTools, never bypass).
//
// What keeps the trial honest:
//   - the feedback-loop gate is off (EXPL1_REVIEW_CHILD=1 makes artifact-gate.mjs and agent-metrics.mjs no-ops), so the
//     eval sees the skill's FIRST output, not the output after the gate bounced it, and no metrics events are recorded;
//   - the run folder .eval-runs/<skill>-<case>-<trial>/ holds only the frozen input; Write/Edit are allowed there only;
//   - Read/Glob/Grep of evals/**, .workflow-artifacts/**, Execution_Examples/** and the gate fixtures is denied, so the
//     expected answers and past runs cannot leak into the trial. Runs are sequential and a finished folder is moved out
//     of .eval-runs/ before the next trial, so a trial never sees another trial's output.
import { query } from "@anthropic-ai/claude-agent-sdk";
import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { EVALS_DIR, REPO_ROOT, skillDir } from "./stages";
import { startStubTracker } from "./stub-tracker";
import type { Case, StageDef } from "./types";

export const SANDBOX_ROOT = path.join(REPO_ROOT, ".eval-runs");

/** Paths the agent under test must never read. */
export const DENIED_READS = [
  `${path.relative(REPO_ROOT, EVALS_DIR).split(path.sep).join("/")}/**`, // wherever the evals folder lives

  ".workflow-artifacts/**",
  "Execution_Examples/**",
  ".claude/hooks/test/fixtures/**",
  "docs/**",
  ".git/**",
  ".env",
];

export interface TraceEntry {
  kind: "tool_use" | "tool_result";
  name?: string;
  input?: unknown;
  is_error?: boolean;
  text?: string;
}

export interface TrialRun {
  dir: string; // absolute sandbox folder
  relDir: string; // repo-relative, forward slashes
  reply: string;
  finalReply: string;
  costUsd: number;
  turns: number;
  durationMs: number;
  error?: string;
  trace: TraceEntry[];
}

function findGitBashBin(): string {
  const candidates = ["C:\\qa\\Git\\usr\\bin", "C:\\Program Files\\Git\\usr\\bin", "C:\\Program Files (x86)\\Git\\usr\\bin"];
  return candidates.find((p) => fs.existsSync(p)) ?? "";
}

let resolvedBin: string | undefined | null = null;

/**
 * The Claude Code binary the SDK drives. The CLI bundled inside the SDK package can be too old for the pinned models
 * ("does not support this model; version … or newer is required"), so prefer the installed `claude` (the one the
 * reviewer subagent runs through too). EVAL_CLAUDE_BIN overrides; none found = the SDK's bundled binary.
 */
export function claudeExecutable(): string | undefined {
  if (resolvedBin !== null) return resolvedBin;
  const fromEnv = process.env["EVAL_CLAUDE_BIN"];
  if (fromEnv) return (resolvedBin = fromEnv);
  const r = spawnSync(process.platform === "win32" ? "where" : "which", ["claude"], { encoding: "utf8" });
  const hits = r.status === 0 ? r.stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean) : [];
  resolvedBin = hits.find((h) => /\.exe$/i.test(h)) ?? hits[0];
  return resolvedBin;
}

/** Environment of the agent process: empty API-key variables mean "not set"; the gate is switched off. */
export function agentEnv(): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = { ...process.env };
  for (const k of ["ANTHROPIC_API_KEY", "CLAUDE_CODE_OAUTH_TOKEN"]) if (env[k] === "") delete env[k];
  const extra = [path.dirname(process.execPath), findGitBashBin()].filter(Boolean).join(path.delimiter);
  env["PATH"] = extra + path.delimiter + (process.env["PATH"] ?? "");
  env["EXPL1_REVIEW_CHILD"] = "1";
  return env;
}

export function resetSandboxRoot(): void {
  fs.rmSync(SANDBOX_ROOT, { recursive: true, force: true });
  fs.mkdirSync(SANDBOX_ROOT, { recursive: true });
}

const SIBLING_HEADERS: Record<string, string> = { Context: "1-context.md", Requirements: "2-requirements.md", Checklist: "3-checklist.md" };

/** Copy the frozen inputs of a case into the run folder (tracker.json is served by the stub, not copied). */
export function seedInputs(skill: string, c: Case, dir: string, relDir: string): void {
  const src = path.join(skillDir(skill), "inputs", c.input);
  for (const f of fs.readdirSync(src)) {
    if (f === "tracker.json") continue;
    let text = fs.readFileSync(path.join(src, f), "utf8");
    // The header line that names the previous stage's file should not point into the (denied) .workflow-artifacts/.
    text = text.replace(/^(Context|Requirements|Checklist): .*$/m, (_m, h: string) => `${h}: ${relDir}/${c.key}-${SIBLING_HEADERS[h]}`);
    fs.writeFileSync(path.join(dir, f), text);
  }
}

export function allowedTools(stage: StageDef, baseUrl?: string): string[] {
  const tools = ["Read", "Glob", "Grep", "Write(.eval-runs/**)", "Edit(.eval-runs/**)"];
  if (stage.n === 1 && baseUrl) {
    tools.push(
      `Bash(curl -s --max-time 5 ${baseUrl}/:*)`,
      `Bash(curl -s --retry 3 --retry-all-errors --max-time 10 --create-dirs ${baseUrl}/:*)`,
      "Bash(date:*)",
    );
  }
  return tools;
}

export const disallowedTools = (): string[] => DENIED_READS.map((p) => `Read(${p})`);

export async function runSkillTrial(
  stage: StageDef,
  c: Case,
  trial: number,
  opts: { timeoutMs: number; maxBudgetUsd: number },
): Promise<TrialRun> {
  const name = `${stage.skill}-${c.id}-${trial}`;
  const dir = path.join(SANDBOX_ROOT, name);
  const relDir = `.eval-runs/${name}`;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  seedInputs(stage.skill, c, dir, relDir);

  const run: TrialRun = { dir, relDir, reply: "", finalReply: "", costUsd: 0, turns: 0, durationMs: 0, trace: [] };
  const started = Date.now();
  const stub = stage.n === 1 ? await startStubTracker(path.join(skillDir(stage.skill), "inputs", c.input, "tracker.json"), c.key) : null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
  const prompt = `/${stage.skill} --run-dir ${relDir} --autonomous ${c.key}${stub ? ` --base ${stub.baseUrl}` : ""}`;

  try {
    const stream = query({
      prompt,
      options: {
        cwd: REPO_ROOT,
        pathToClaudeCodeExecutable: claudeExecutable(),
        model: c.model ?? stage.model,
        effort: stage.effort,
        thinking: stage.thinking ? { type: "adaptive" } : { type: "disabled" },
        settingSources: ["project"],
        skills: "all",
        permissionMode: "dontAsk",
        allowedTools: allowedTools(stage, stub?.baseUrl),
        disallowedTools: disallowedTools(),
        maxTurns: stage.maxTurns,
        maxBudgetUsd: opts.maxBudgetUsd,
        persistSession: false,
        abortController: controller,
        env: agentEnv(),
      },
    });
    const texts: string[] = [];
    for await (const message of stream) {
      if (message.type === "assistant") {
        const content = message.message?.content;
        if (!Array.isArray(content)) continue;
        for (const block of content) {
          const b = block as unknown as Record<string, unknown>;
          if (b["type"] === "text" && typeof b["text"] === "string") texts.push(b["text"]);
          else if (b["type"] === "tool_use") run.trace.push({ kind: "tool_use", name: String(b["name"]), input: b["input"] });
        }
      } else if (message.type === "user") {
        const content = (message as unknown as { message?: { content?: unknown } }).message?.content;
        if (!Array.isArray(content)) continue;
        for (const block of content as Record<string, unknown>[]) {
          if (block["type"] !== "tool_result") continue;
          const raw = block["content"];
          const text = typeof raw === "string" ? raw : JSON.stringify(raw);
          run.trace.push({ kind: "tool_result", is_error: block["is_error"] === true, text: text.slice(0, 300) });
        }
      } else if (message.type === "result") {
        const r = message as unknown as { subtype: string; result?: string; total_cost_usd?: number; num_turns?: number; duration_ms?: number; errors?: string[] };
        run.costUsd = r.total_cost_usd ?? 0;
        run.turns = r.num_turns ?? 0;
        if (r.subtype === "success") {
          if (typeof r.result === "string" && r.result.trim() !== "") run.finalReply = r.result;
        } else {
          run.error = `${r.subtype}${r.errors?.length ? `: ${r.errors.join("; ").slice(0, 300)}` : ""}`;
        }
      }
    }
    run.reply = texts.join("\n\n");
    if (!run.finalReply) run.finalReply = texts[texts.length - 1] ?? "";
  } catch (err: unknown) {
    const e = err as Error;
    run.error = controller.signal.aborted ? `timed out after ${Math.round(opts.timeoutMs / 1000)}s` : (e.message ?? String(err));
  } finally {
    clearTimeout(timer);
    await stub?.close();
    run.durationMs = Date.now() - started;
  }
  fs.writeFileSync(path.join(dir, "_trace.jsonl"), run.trace.map((t) => JSON.stringify(t)).join("\n"));
  fs.writeFileSync(path.join(dir, "_reply.txt"), run.reply);
  return run;
}

/** Read-denial probe for verification step 3: the agent is asked to read files it must not see. */
export async function probeLeak(): Promise<{ denied: boolean; detail: string }> {
  const evalsRel = path.relative(REPO_ROOT, EVALS_DIR).split(path.sep).join("/");
  // Existing FILES only: a refusal must come from the deny rule, not from a missing path or a directory.
  const targets = [
    `${evalsRel}/expl1-1-task-context/cases.jsonl`,
    ".workflow-artifacts/TASK-114/TASK-114-1-context.md",
    "Execution_Examples/expl-bot/runs/eb-261106-1157/meta.md",
    ".claude/hooks/test/fixtures/requirements/_base/TASK-114-2-requirements.md",
  ];
  const missing = targets.filter((t) => !fs.existsSync(path.join(REPO_ROOT, t)));
  if (missing.length) return { denied: false, detail: `probe targets do not exist (cannot prove a denial): ${missing.join(", ")}` };
  fs.mkdirSync(SANDBOX_ROOT, { recursive: true });
  const trace: TraceEntry[] = [];
  const stream = query({
    prompt: `Use the Read tool, one call per file, on each of these paths and report for each one whether it worked (first 5 words of content) or was refused: ${targets.join(" ; ")}. Do not try any other way to read them.`,
    options: {
      cwd: REPO_ROOT,
      pathToClaudeCodeExecutable: claudeExecutable(),
      model: "claude-haiku-5-5",
      settingSources: ["project"],
      permissionMode: "dontAsk",
      allowedTools: ["Read", "Glob", "Grep"],
      disallowedTools: disallowedTools(),
      maxTurns: 12,
      maxBudgetUsd: 0.5, // the trial budget; the probe is a handful of Haiku turns
      persistSession: false,
      env: agentEnv(),
    },
  });
  for await (const message of stream) {
    if (message.type === "assistant" && Array.isArray(message.message?.content)) {
      for (const b of message.message.content as unknown as Record<string, unknown>[]) if (b["type"] === "tool_use") trace.push({ kind: "tool_use", name: String(b["name"]), input: b["input"] });
    } else if (message.type === "user") {
      const content = (message as unknown as { message?: { content?: unknown } }).message?.content;
      if (!Array.isArray(content)) continue;
      for (const b of content as Record<string, unknown>[]) {
        if (b["type"] === "tool_result") trace.push({ kind: "tool_result", is_error: b["is_error"] === true, text: String(typeof b["content"] === "string" ? b["content"] : JSON.stringify(b["content"])).slice(0, 200) });
      }
    }
  }
  const results = trace.filter((t) => t.kind === "tool_result");
  const leaked = results.filter((t) => !t.is_error);
  const notPermission = results.filter((t) => t.is_error && !/permission|denied|not allowed|deny|blocked/i.test(t.text ?? ""));
  return {
    denied: results.length >= targets.length && leaked.length === 0 && notPermission.length === 0,
    detail: `${results.length} tool results, ${leaked.length} not refused, ${notPermission.length} refused for another reason${leaked.length + notPermission.length ? `: ${[...leaked, ...notPermission].map((l) => JSON.stringify(l.text)).join(" ")}` : ` (e.g. ${JSON.stringify(results[0]?.text?.slice(0, 120))})`}`,
  };
}
