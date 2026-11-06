#!/usr/bin/env node
/**
 * Renders the run-cost table for one key: one row per skill run, an orchestrator's own turns as a separate
 * row, subagents indented under the stage that launched them, then a total.
 *
 *   node .claude/hooks/metrics-report.mjs TASK-112                 # markdown table
 *   node .claude/hooks/metrics-report.mjs TASK-112 --detail        # + the in/out/cache split
 *   node .claude/hooks/metrics-report.mjs TASK-112 --save          # table + write the snapshot files (below)
 *   node .claude/hooks/metrics-report.mjs eb-261106-1432 --json    # aggregate + one entry per row
 *   node .claude/hooks/metrics-report.mjs TASK-112 --last          # one SKILL_RUN_METRICS line (latest row)
 *   node .claude/hooks/metrics-report.mjs --list                   # every key with metrics
 *
 * Ported from the mock's `metrics-report.mjs`. Differences: rows are derived from the recorded events and the
 * transcripts every time; the key is a task/bug key or an expl-bot RUN_ID; "Agent" became "Skill"; Active and
 * Wall are separate columns because stages wait for the user.
 *
 * THE SNAPSHOT FILES. The Stop hook already saves them after every turn (see `lib/report-render.mjs`), so a
 * typed `/skill` is saved without anyone running this; `--save` is the same write on demand:
 *   TASK-/BUG-<id>  ->  .workflow-artifacts/<KEY>/<KEY>-metrics.md  and  <KEY>-metrics.json
 *   eb-… RUN_ID     ->  .workflow-artifacts/expl-bot/runs/<RUN_ID>/metrics.md  and  metrics.json
 * Tokens come from `~/.claude/projects` transcripts, which Claude Code may clean up. Every run of this report
 * (saving or not) fills a row whose transcript is gone from the saved JSON, so a saved number is never replaced
 * by a worse one.
 *
 * `Tokens` / `Cost`: every API call inside the row's window — input, output, cache read, cache write — summed
 * from the transcript (once per message id), priced at API list rates (an ESTIMATE of the equivalent API
 * price, NOT plan/session-limit usage). Subagent bills are included in the stage that launched them.
 * WHAT CANNOT BE PRICED IS COUNTED, NOT ESTIMATED. NOTHING HERE CRASHES ON BAD DATA.
 */

import { resolveProjectDir } from "./lib/paths.mjs";
import { buildKeyReport, listKeys, loadSnapshot } from "./lib/report-model.mjs";
import { renderTable, toJson, saveReport } from "./lib/report-render.mjs";
import { summaryLine } from "./agent-metrics.mjs";

const argv = process.argv.slice(2);
const asJson = argv.includes("--json");
const detail = argv.includes("--detail");
const last = argv.includes("--last");
const list = argv.includes("--list");
const save = argv.includes("--save");
const key = argv.find((a) => !a.startsWith("--"));

const projectDir = resolveProjectDir(null);

if (list || !key) {
  const keys = listKeys(projectDir);
  if (keys.length === 0) {
    console.log("No metrics recorded yet (no skill has run in a session with the hooks registered).");
  } else {
    console.log("Keys with metrics (newest first):");
    for (const k of keys) console.log(`- ${k.key}  (${k.rows} row${k.rows === 1 ? "" : "s"}, last ${new Date(k.last).toISOString()})`);
  }
  if (!list) console.error("\nusage: node .claude/hooks/metrics-report.mjs <KEY> [--json] [--detail] [--save] [--last] | --list");
  process.exit(list ? 0 : 1);
}

const report = buildKeyReport(projectDir, key, { snapshot: loadSnapshot(projectDir, key) });

if (report.rows.length === 0) {
  console.log(`No metrics recorded for ${key}.`);
  process.exit(0);
}

if (last) {
  console.log(summaryLine(report.rows.at(-1), report));
  process.exit(0);
}

if (save) {
  try {
    const saved = saveReport(projectDir, report, key);
    if (saved) console.error(`Saved: ${saved.md}\nSaved: ${saved.json}`);
    else console.log(`Not saved: "${key}" is not a TASK-/BUG- key or an expl-bot RUN_ID, so there is no artifact folder for it.`);
  } catch (err) {
    console.error(`Not saved: ${String(err?.message ?? err)}`);
  }
}

console.log(asJson ? JSON.stringify(toJson(report, key), null, 2) : renderTable(report, key, detail));
