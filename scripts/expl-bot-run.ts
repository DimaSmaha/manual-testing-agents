// Flow 2 runner: drives /expl-bot-independent-orchestrator headlessly through the Claude Agent SDK.
//
// Usage:  npm run expl-bot:run -- <url> [--focus "…"] [--style normal|curious|psycho]
//                                   [--scope page|site] [--pages "<path>,<path>"] [--max-pages N]
//                                   [--max-tests N] [--max-duration M] [--deep] [--headed] [--from <ISSUEKEY>]
// Scope: the default is `site` (start URL + discovered pages, at most --max-pages, default 8); `page` = this URL only.
// Exit codes: 0 ok · 2 pipeline error / stopped early / bad input · 3 fatal · 130 SIGINT
import "dotenv/config";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import {
  c,
  printBanner,
  printToolUse,
  printFinalSummary,
  scanTextBlock,
  type PhaseCompact,
} from "./utils/colors";

const PROJECT_ROOT = path.resolve(__dirname, "..");
const MAX_TURNS = Number(process.env["MAX_PIPELINE_TURNS"] ?? 300);

// Whitelist instead of bypassPermissions: with permissionMode "dontAsk" anything not listed is denied, never prompted.
const ALLOWED_TOOLS = [
  "Read",
  "Write",
  "Edit",
  "Glob",
  "Grep",
  "Agent",
  "SendMessage",
  "Bash(playwright-cli:*)",
  "Bash(date:*)",
  "Bash(printenv EXPL_BOT_AUTH)",
  "Bash(git status:*)",
  // read-only run-cost table printed at the end of the run (hooks in .claude/hooks/ record it)
  "Bash(node .claude/hooks/metrics-report.mjs:*)",
];

function findGitBashBin(): string {
  const candidates = [
    "C:\\qa\\Git\\usr\\bin",
    "C:\\Program Files\\Git\\usr\\bin",
    "C:\\Program Files (x86)\\Git\\usr\\bin",
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? "";
}

// Same rule as run-context.md: hostname (+ non-default port), non-alphanumerics -> "-".
function hostSlug(url: string): string {
  const u = new URL(url);
  const raw = u.port ? `${u.hostname}:${u.port}` : u.hostname;
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function closeBrowser(session: string): void {
  // slug is [a-z0-9-] only, so running through a shell (needed for the .cmd shim on Windows) is safe.
  const r = spawnSync("playwright-cli", [`-s=${session}`, "close"], {
    shell: true,
    stdio: "ignore",
    timeout: 20000,
  });
  if (r.status === 0)
    console.log(`${c.dim}Browser session ${session} closed.${c.reset}`);
}

interface Parsed {
  url: string;
  passthrough: string[];
}

const VALUE_FLAGS = new Set([
  "--focus",
  "--style",
  "--max-tests",
  "--max-duration",
  "--from",
  "--scope",
  "--pages",
  "--max-pages",
]);
const BOOL_FLAGS = new Set(["--deep", "--headed"]);

function parseArgs(argv: string[]): Parsed {
  let positional = "";
  const passthrough: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (VALUE_FLAGS.has(a)) {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      passthrough.push(a, `"${v.replace(/"/g, "'")}"`);
    } else if (BOOL_FLAGS.has(a)) {
      passthrough.push(a);
    } else if (a.startsWith("--")) {
      throw new Error(`Unknown option ${a}`);
    } else if (!positional) {
      positional = a;
    } else {
      throw new Error(`Unexpected argument "${a}"`);
    }
  }
  // the argument wins over EXPL_BOT_URL from .env
  const url = positional || process.env["EXPL_BOT_URL"] || "";
  if (!url) throw new Error("URL is required (argument or EXPL_BOT_URL)");
  if (!/^https?:\/\//i.test(url))
    throw new Error(`URL must start with http:// or https:// (got "${url}")`);
  return { url, passthrough };
}

async function main(): Promise<void> {
  // .env lines like `ANTHROPIC_API_KEY=` define empty strings; an empty value must behave as "not set".
  for (const k of [
    "ANTHROPIC_API_KEY",
    "CLAUDE_CODE_OAUTH_TOKEN",
    "EXPL_BOT_AUTH",
  ]) {
    if (process.env[k] === "") delete process.env[k];
  }

  let parsed: Parsed;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (err: unknown) {
    console.error(`${c.red}[ERROR] ${(err as Error).message}${c.reset}`);
    console.error(
      `\nUsage:   npm run expl-bot:run -- <url> [--scope page|site] [--pages "<path>,<path>"] [--max-pages N] [--focus "…"] [--style normal|curious|psycho] [--max-tests N] [--max-duration M] [--deep] [--headed] [--from <ISSUEKEY>]`,
    );
    console.error(
      `Example: npm run expl-bot:run -- http://localhost:3000/products --scope page --max-tests 2\n`,
    );
    process.exit(2);
  }

  const hasAuthCreds = Boolean(
    process.env["ANTHROPIC_API_KEY"] || process.env["CLAUDE_CODE_OAUTH_TOKEN"],
  );
  if (!hasAuthCreds) {
    console.log(
      `${c.dim}No ANTHROPIC_API_KEY / CLAUDE_CODE_OAUTH_TOKEN in the environment: using the local Claude Code login if there is one.${c.reset}`,
    );
  }

  const session = `expl-${hostSlug(parsed.url)}`;
  const prompt =
    `/expl-bot-independent-orchestrator ${parsed.url} ${parsed.passthrough.join(" ")}`.trim();

  const controller = new AbortController();
  process.on("SIGINT", () => {
    console.log(`\n${c.yellow}[INTERRUPTED] Aborting run...${c.reset}`);
    controller.abort();
  });

  printBanner(prompt);
  console.log(
    `${c.dim}Session: ${session} · EXPL_BOT_AUTH: ${process.env["EXPL_BOT_AUTH"] ? "set" : "not set"}${c.reset}\n`,
  );

  const phaseCompacts: PhaseCompact[] = [];
  const textBuffer: string[] = [];
  let sessionId = "";
  let exitCode = 0;
  let finalText = "";

  // Ensure bash (Git for Windows) and npx are resolvable inside the agent session.
  const nodeBinDir = path.dirname(process.execPath);
  const gitBashDir = findGitBashBin();
  const extraDirs = [nodeBinDir, gitBashDir]
    .filter(Boolean)
    .join(path.delimiter);
  const augmentedPath =
    extraDirs + path.delimiter + (process.env["PATH"] ?? "");

  try {
    const stream = query({
      prompt,
      options: {
        cwd: PROJECT_ROOT,
        settingSources: ["project"],
        skills: "all",
        permissionMode: "dontAsk",
        allowedTools: ALLOWED_TOOLS,
        maxTurns: MAX_TURNS,
        abortController: controller,
        // EXPL_BOT_AUTH travels in the environment only; the agent reads it with `printenv EXPL_BOT_AUTH`.
        env: { ...process.env, PATH: augmentedPath },
      },
    });

    for await (const message of stream) {
      if (message.type === "system" && message.subtype === "init") {
        sessionId = message.session_id;
        console.log(`${c.dim}Session: ${sessionId}${c.reset}`);
        console.log(`${c.dim}Model:   ${message.model}${c.reset}\n`);
      } else if (message.type === "assistant") {
        const content = message.message?.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            const b = block as unknown as Record<string, unknown>;
            if (b["type"] === "text" && typeof b["text"] === "string") {
              finalText = b["text"];
              scanTextBlock(b["text"], textBuffer, phaseCompacts);
            } else if (
              b["type"] === "tool_use" &&
              typeof b["name"] === "string"
            ) {
              printToolUse(
                b["name"],
                (b["input"] as Record<string, unknown>) ?? {},
              );
            }
          }
        }
      } else if (message.type === "result") {
        const r = message as unknown as {
          subtype: string;
          total_cost_usd: number;
          duration_ms: number;
          num_turns: number;
          errors?: string[];
        };
        if (r.subtype === "success") {
          printFinalSummary(
            phaseCompacts,
            r.total_cost_usd,
            r.duration_ms,
            r.num_turns,
            sessionId,
          );
          // The orchestrator reports early stops in-band (it never asks): treat them as pipeline errors.
          const earlyFail = phaseCompacts.some(
            (p) => /^Phase [012]\b/.test(p.phase) && p.status === "FAILED",
          );
          if (
            earlyFail ||
            /^\s*STOPPED:/.test(finalText) ||
            /\bSTOP:/.test(finalText.slice(0, 200))
          ) {
            console.error(
              `${c.red}${c.bold}[STOPPED EARLY]${c.reset} see the final message above.`,
            );
            exitCode = 2;
          }
        } else {
          console.error(
            `\n${c.red}${c.bold}[PIPELINE ERROR] ${r.subtype}${c.reset}`,
          );
          if (Array.isArray(r.errors)) {
            for (const e of r.errors) console.error(`  ${c.red}${e}${c.reset}`);
          }
          exitCode = 2;
        }
      }
    }
  } catch (err: unknown) {
    const e = err as Error;
    closeBrowser(session);
    if (e.name === "AbortError" || e.message?.includes("aborted")) {
      console.log(`\n${c.yellow}Run aborted.${c.reset}`);
      process.exit(130);
    }
    console.error(`\n${c.red}${c.bold}[FATAL]${c.reset}`, e.message ?? e);
    process.exit(3);
  }

  closeBrowser(session);
  process.exit(exitCode);
}

main();
