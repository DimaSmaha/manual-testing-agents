// Terminal helpers for scripts/expl-bot-run.ts.

export const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
};

export interface PhaseCompact {
  phase: string;
  scenario_index?: number;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  [key: string]: unknown;
}

// Matches <!-- PHASE COMPACT: label --> followed by a JSON block.
// Uses \} (not \n\}) so single-line JSON is also captured.
export const PHASE_COMPACT_RE =
  /<!--\s*PHASE COMPACT:\s*([^\s>\-][^>]*?)-->\s*(\{[\s\S]*?\})/g;

export function printBanner(title: string, color: string = c.cyan): void {
  const line = "═".repeat(62);
  console.log(`\n${color}${c.bold}${line}${c.reset}`);
  console.log(`${color}${c.bold}  ${title}${c.reset}`);
  console.log(`${color}${c.bold}${line}${c.reset}`);
}

export function printPhaseCompact(compact: PhaseCompact): void {
  const statusColor =
    compact.status === "SUCCESS"
      ? c.green
      : compact.status === "SKIPPED"
        ? c.yellow
        : c.red;
  const label =
    compact.scenario_index !== undefined
      ? `${compact.phase} [scenario ${compact.scenario_index}]`
      : compact.phase;
  console.log(`\n${c.magenta}${c.bold}┌─ PHASE COMPACT: ${label}${c.reset}`);
  console.log(
    `${c.magenta}│${c.reset}  status: ${statusColor}${c.bold}${compact.status}${c.reset}`,
  );
  for (const [k, v] of Object.entries(compact)) {
    if (k === "phase" || k === "status" || k === "scenario_index") continue;
    const val = typeof v === "object" ? JSON.stringify(v) : String(v);
    console.log(`${c.magenta}│${c.reset}  ${k}: ${c.cyan}${val}${c.reset}`);
  }
  console.log(`${c.magenta}└${"─".repeat(42)}${c.reset}`);
}

// Never print anything that touches credentials or login state.
const SENSITIVE_PATTERNS = [
  ".env",
  "auth.json",
  "expl_bot_auth",
  ".playwright-auth",
  "cat .env",
  "Get-Content .env",
  "state-load",
  "state-save",
];
const PROJECT_ROOT_RE = /[A-Z]:\\[^\s"']+manual-testing-agents[\\\/]/gi;

function sanitizeDetail(raw: string): string {
  const lower = raw.toLowerCase();
  if (SENSITIVE_PATTERNS.some((p) => lower.includes(p.toLowerCase()))) {
    return "[config/auth operation]";
  }
  return raw.replace(PROJECT_ROOT_RE, "");
}

const MEANINGFUL_RE =
  /playwright-cli|\.sh\b|bash |scripts\/|npx |tsx |node |^& "/;
const PREAMBLE_RE = /^(function |param\(|\$psi|\}|#)/;

function extractCommand(cmd: string): string {
  const lines = cmd
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length <= 1) return cmd.slice(0, 120);
  // Prefer the last line that looks like a real invocation
  const meaningful = lines.filter((l) => MEANINGFUL_RE.test(l));
  if (meaningful.length > 0)
    return meaningful[meaningful.length - 1]!.slice(0, 120);
  // Fall back to first non-preamble line
  const fallback = lines.find((l) => !PREAMBLE_RE.test(l));
  return (fallback ?? lines[0] ?? cmd).slice(0, 120);
}

export function printToolUse(
  name: string,
  input: Record<string, unknown>,
): void {
  let detail = "";
  if (typeof input["command"] === "string")
    detail = extractCommand(input["command"]);
  else if (typeof input["file_path"] === "string") detail = input["file_path"];
  else if (typeof input["pattern"] === "string") detail = input["pattern"];
  else if (typeof input["url"] === "string") detail = input["url"];
  else if (typeof input["prompt"] === "string")
    detail = (input["prompt"] as string).slice(0, 80);
  else detail = JSON.stringify(input).slice(0, 80);
  detail = sanitizeDetail(detail);
  console.log(
    `  ${c.yellow}[TOOL]${c.reset} ${c.bold}${name}${c.reset} ${c.dim}${detail}${c.reset}`,
  );
}

function num(block: PhaseCompact | undefined, key: string): number {
  return block ? Number(block[key] ?? 0) : 0;
}

export function printFinalSummary(
  phaseCompacts: PhaseCompact[],
  totalCostUsd: number,
  durationMs: number,
  numTurns: number,
  sessionId: string,
): void {
  printBanner("EXPL-BOT RUN COMPLETE", c.green);

  console.log(`\n${c.bold}Session:${c.reset}  ${sessionId}`);
  console.log(
    `${c.bold}Turns:${c.reset}    ${numTurns}  │  ` +
      `${c.bold}Duration:${c.reset} ${(durationMs / 1000).toFixed(1)}s  │  ` +
      `${c.bold}Cost:${c.reset} $${totalCostUsd.toFixed(4)}`,
  );

  if (phaseCompacts.length > 0) {
    console.log(`\n${c.bold}Phase results:${c.reset}`);
    for (const p of phaseCompacts) {
      const col =
        p.status === "SUCCESS"
          ? c.green
          : p.status === "SKIPPED"
            ? c.yellow
            : c.red;
      const label =
        p.scenario_index !== undefined
          ? `${p.phase} [s${p.scenario_index}]`
          : p.phase;
      console.log(`  ${label.padEnd(44)} ${col}${p.status}${c.reset}`);
    }
  }

  const discover = phaseCompacts.find((p) => p.phase === "Phase 1 discover");
  const researched = phaseCompacts.filter(
    (p) => p.phase.startsWith("Phase 1 research") && p.status === "SUCCESS",
  ).length;
  const researchSkipped = phaseCompacts.filter(
    (p) => p.phase.startsWith("Phase 1 research") && p.status === "SKIPPED",
  ).length;
  const plan = phaseCompacts.find((p) => p.phase === "Phase 2 plan");
  const tests = phaseCompacts.find((p) => p.phase === "Phase 3 summary");
  const report = phaseCompacts.find((p) => p.phase === "Phase 4 report");
  const defects =
    num(report, "defects_high") +
    num(report, "defects_medium") +
    num(report, "defects_low");

  console.log(`\n${c.bold}Totals:${c.reset}`);
  console.log(
    `  Pages researched:    ${c.cyan}${researched}${c.reset}` +
      (researchSkipped > 0
        ? ` ${c.dim}(${researchSkipped} skipped)${c.reset}`
        : "") +
      (discover
        ? ` ${c.dim}· not covered: ${num(discover, "pages_skipped_cap") + num(discover, "pages_needs_data")}${c.reset}`
        : ""),
  );
  console.log(
    `  Scenarios planned:   ${c.cyan}${num(plan, "scenario_count")}${c.reset}`,
  );
  console.log(
    `  Passed / failed:     ${c.green}${num(tests, "passed")}${c.reset} / ` +
      `${num(tests, "failed") > 0 ? c.red : c.dim}${num(tests, "failed")}${c.reset}`,
  );
  console.log(
    `  Stuck / blocked:     ${c.yellow}${num(tests, "stuck")}${c.reset} / ${c.yellow}${num(tests, "blocked")}${c.reset}`,
  );
  console.log(
    `  Product defects:     ${defects > 0 ? c.red : c.dim}${defects}${c.reset}`,
  );
  console.log(
    `  Execution issues:    ${c.cyan}${num(report, "execution_issues")}${c.reset}`,
  );
  console.log(
    `  Own data left over:  ${c.cyan}${num(report, "data_left_over")}${c.reset}`,
  );
  console.log();
}

export function scanTextBlock(
  text: string,
  textBuffer: string[],
  phaseCompacts: PhaseCompact[],
): string {
  const trimmed = text.replace(/\n{3,}/g, "\n\n").trim();
  if (trimmed) {
    for (const line of trimmed.split("\n")) {
      if (line.startsWith("✓") || line.startsWith("+ ")) {
        console.log(`  ${c.green}${line}${c.reset}`);
      } else if (/^#{1,3}\s/.test(line) || /^Phase\s/i.test(line)) {
        console.log(`  ${c.cyan}${c.bold}${line}${c.reset}`);
      } else {
        console.log(`  ${line}`);
      }
    }
  }

  // Rolling buffer for cross-message phase compact detection
  const buffer = (textBuffer.join("") + text).slice(-3000);
  textBuffer.length = 0;
  textBuffer.push(buffer);

  PHASE_COMPACT_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PHASE_COMPACT_RE.exec(buffer)) !== null) {
    try {
      const compact = JSON.parse(match[2]!) as PhaseCompact;
      if (!compact.phase) compact.phase = match[1]!.trim();
      const isDupe = phaseCompacts.some(
        (p) =>
          p.phase === compact.phase &&
          p.scenario_index === compact.scenario_index &&
          p.status === compact.status,
      );
      if (!isDupe) {
        phaseCompacts.push(compact);
        printPhaseCompact(compact);
      }
    } catch {
      // Not valid JSON — skip
    }
  }

  return buffer;
}
