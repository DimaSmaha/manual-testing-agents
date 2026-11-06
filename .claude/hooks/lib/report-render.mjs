/**
 * Renders a key's report as markdown / JSON and saves it next to the key's own artifacts.
 * Shared by `metrics-report.mjs` (the CLI, `--save`) and `agent-metrics.mjs --turn-end` (the Stop hook saves
 * after EVERY turn, so a typed `/skill` that no orchestrator wraps is saved too).
 *
 * Saved files (script-owned — re-saving overwrites them; nothing else ever edits them):
 *   TASK-/BUG-<id>  ->  .workflow-artifacts/<KEY>/<KEY>-metrics.md  and  <KEY>-metrics.json
 *   eb-… RUN_ID     ->  .workflow-artifacts/expl-bot/runs/<RUN_ID>/metrics.md  and  metrics.json
 * `unassigned` has no artifact folder and is not saved.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { saveTargets } from "./report-model.mjs";
import { formatUsd, RATES_AS_OF } from "./pricing.mjs";

const n = (v) => (v === null || v === undefined ? "—" : v.toLocaleString("en-US"));
const secs = (v) => (v === null || v === undefined ? "—" : `${(v / 1000).toFixed(1)}s`);
const cost = (r) => (r.price?.usd != null ? formatUsd(r.price.usd) : "—");

export function toJson(report, key) {
  const { rows, totals, wall } = report;
  return {
    key,
    saved_at: new Date().toISOString(),
    totals_scope: "billed_sum_over_api_calls_in_window",
    totals,
    pricing: { rates_as_of: RATES_AS_OF, scope: "api_list_price_estimate_not_plan_usage" },
    wall_clock: wall,
    rows: rows.map((r) => ({
      kind: r.kind,
      skill: r.skill,
      run: r.run,
      runs_for_skill: r.runsForSkill,
      session_id: r.sessionId,
      started_at: r.startIso,
      finished_at: r.finishIso,
      active_ms: r.activeMs,
      wall_ms: r.wallMs,
      billed: r.billed,
      cost_usd: r.price?.usd ?? null,
      cost_unpriced_reason: r.price && r.price.usd === null ? r.price.reason : null,
      transcript_found: !r.noTranscript,
      restored_from_snapshot: Boolean(r.restored),
      subagents: r.subagents.map((a) => ({
        agent: a.agent,
        status: a.status,
        duration_ms: a.durationMs ?? null,
        billed: a.billed,
        cost_usd: a.price?.usd ?? null,
      })),
    })),
  };
}

export function renderTable(report, key, detail) {
  const { rows, totals, wall } = report;
  const out = [];
  const title = totals.orchestrator_rows ? `Orchestrator run cost — ${key}` : `Skill run cost — ${key}`;
  out.push(`### ${title}\n`);
  const headCols = ["#", "Skill", "Run", "Model", "Calls", "Tools", "Active", "Wall", "Tokens"];
  const tailCols = detail ? ["In", "Out", "Cache read", "Cache write", "Cost"] : ["Cost"];
  const cols = [...headCols, ...tailCols];
  out.push(`| ${cols.join(" | ")} |`);
  out.push(`|${cols.map(() => "---").join("|")}|`);

  const tail = (b, c) =>
    detail
      ? [n(b?.input ?? null), n(b?.output ?? null), n(b?.cache_read ?? null), n(b?.cache_write ?? null), c]
      : [c];

  rows.forEach((r, i) => {
    const label = r.kind === "group" ? `\`${r.skill}\` (own turns)` : `\`${r.skill}\``;
    const base = [
      i + 1,
      label,
      `${r.run}/${r.runsForSkill}`,
      r.billed?.model ?? "—",
      n(r.billed?.api_calls ?? null),
      n(r.billed?.tool_uses ?? null),
      secs(r.activeMs),
      secs(r.wallMs),
      n(r.billed?.total ?? null),
    ];
    out.push(`| ${[...base, ...tail(r.billed, cost(r))].join(" | ")} |`);
    for (const a of r.subagents) {
      const sub = [
        "↳",
        `\`${a.agent}\` _(in row above)_`,
        a.status,
        a.billed?.model ?? "—",
        n(a.billed?.api_calls ?? null),
        n(a.billed?.tool_uses ?? null),
        "—",
        secs(a.durationMs ?? a.billed?.duration_ms ?? null),
        n(a.billed?.total ?? null),
      ];
      out.push(`| ${[...sub, ...tail(a.billed, a.price?.usd != null ? formatUsd(a.price.usd) : "—")].join(" | ")} |`);
    }
  });

  const sigma = [
    "**Σ**",
    `**${totals.orchestrator_rows ? "orchestrator total" : "total"}**`,
    `**${totals.skill_runs} skill run${totals.skill_runs === 1 ? "" : "s"}**`,
    "",
    `**${n(totals.api_calls)}**`,
    `**${n(totals.tool_uses)}**`,
    `**${secs(totals.active_ms)}**`,
    wall ? `**${secs(wall.ms)}**` : "—",
    `**${n(totals.tokens)}**`,
  ];
  const sigmaTail = detail
    ? [
        `**${n(totals.input)}**`,
        `**${n(totals.output)}**`,
        `**${n(totals.cache_read)}**`,
        `**${n(totals.cache_write)}**`,
        `**${totals.usd === null ? "—" : formatUsd(totals.usd)}**`,
      ]
    : [`**${totals.usd === null ? "—" : formatUsd(totals.usd)}**`];
  out.push(`| ${[...sigma, ...sigmaTail].join(" | ")} |`);

  out.push(
    `\n**Tokens and Cost.** Every API call inside the row's window — input, output, cache read and cache write — ` +
      `summed from the session transcript (once per message) plus the subagents launched in it. Cost is an ` +
      `estimate at API list rates as of ${RATES_AS_OF}: it is not your plan or session-limit usage. \`Active\` is ` +
      `the time the agent was working (user prompt → stop); \`Wall\` is launch → last stop of that stage, ` +
      `including questions the stage asked the user. The Σ wall clock is first launch → last stop of the latest session.`,
  );

  const notes = [];
  notes.push(
    `Per-skill figures are attributed by time window in one shared conversation: a skill's row covers ` +
      `everything from its launch until the next skill starts` +
      (totals.orchestrator_rows
        ? `, except the turn in which an orchestrator launches the next stage, which is the orchestrator's own.`
        : `.`),
  );
  if (totals.unpriced_rows > 0) {
    notes.push(
      `${totals.unpriced_rows} row(s) carry token counts but no price (${totals.unpriced_reasons.join(", ")}): ` +
        `a model absent from the rate table, a non-standard speed or a price tier the log cannot split is left ` +
        `blank rather than guessed.`,
    );
  }
  if (totals.restored_from_snapshot > 0) {
    notes.push(
      `${totals.restored_from_snapshot} row(s) were restored from the saved snapshot ` +
        `(\`${key}\` metrics.json): their session transcript is no longer on this machine.`,
    );
  }
  const noBill = rows.filter((r) => !r.billed).length;
  if (noBill > 0) {
    notes.push(
      `${noBill} row(s) have no token figures: the session transcript is not on this machine ` +
        `(\`~/.claude/projects\`) and no saved snapshot covers it, or the window held no model call. ` +
        `Their Active/Wall are still measured.`,
    );
  }
  if (totals.interrupted_subagents > 0) {
    notes.push(
      `${totals.interrupted_subagents} subagent run(s) were interrupted/failed: a run that never finished has no ` +
        `bill on record, and a partial sum is not one.`,
    );
  }
  if (wall && wall.sessions > 1) {
    notes.push(`This key spans ${wall.sessions} sessions; the wall clock shown is the latest session's (${wall.runs} rows).`);
  }
  out.push(`\n${notes.join("\n")}`);
  return out.join("\n");
}

/**
 * Write `<…>metrics.md` (detailed table) and `<…>metrics.json` (full bill) for the key.
 * Returns `{ md, json }`, or `null` when the key has no artifact folder. Throws on a write error —
 * callers decide whether that matters (the hook swallows it into a diagnostic, the CLI prints it).
 */
export function saveReport(projectDir, report, key) {
  const target = saveTargets(projectDir, key);
  if (!target) return null;
  mkdirSync(target.dir, { recursive: true });
  const header =
    `# ${key} - agent run metrics\n\n` +
    `Generated: ${new Date().toISOString()}\n` +
    `Source: \`node .claude/hooks/metrics-report.mjs ${key} --save\`, also written by the Stop hook after every ` +
    `turn (script-owned: it is overwritten each time; the full per-model bill is in ` +
    `\`${target.json.split(/[\\/]/).pop()}\`)\n\n`;
  writeFileSync(target.md, header + renderTable(report, key, true) + "\n", "utf8");
  writeFileSync(target.json, JSON.stringify(toJson(report, key), null, 2) + "\n", "utf8");
  return { md: target.md, json: target.json };
}
