// Stand-in for the `claude` CLI in the offline runner: run-artifact-gate-cases.mjs --reviewer fake sets
// CLAUDE_BIN=.claude/hooks/test/fake-claude.mjs, and lib/review-subagent.mjs runs a .mjs CLAUDE_BIN under node.
// It answers like `claude -p "Review <path>. …" --agent <name> --output-format json --json-schema …`, judging the
// reviewed file only by markers a fixture puts in it — so the loop mechanics (layers, cache, retries) are tested
// for free and deterministically, while the real reviewers are tested with --reviewer real:
//   <!-- fake-review: FAIL <note> -->   → verdict FAIL with that note (several markers → several notes)
//   <!-- fake-review: ERROR -->         → an error result (the gate must record UNVERIFIED)
//   no marker                           → verdict PASS
// Every call appends one line to FAKE_REVIEW_LOG (when set), so a case can assert how often the reviewer ran.

import { readFileSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const arg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const prompt = arg("-p") ?? "";
const agent = arg("--agent") ?? "";
const target = /^Review (.+?\.md)\b/.exec(prompt)?.[1] ?? null;

let text = "";
try {
  text = target ? readFileSync(resolve(process.cwd(), target), "utf8") : "";
} catch {
  /* an unreadable file reviews as PASS — the gate's own checks run before the reviewer */
}
if (process.env.FAKE_REVIEW_LOG) {
  try {
    appendFileSync(process.env.FAKE_REVIEW_LOG, JSON.stringify({ agent, target, schema: Boolean(arg("--json-schema")) }) + "\n");
  } catch {
    /* logging is best effort */
  }
}

const out = (o) => process.stdout.write(JSON.stringify(o) + "\n");
if (/<!--\s*fake-review:\s*ERROR\s*-->/.test(text)) {
  out({ type: "result", subtype: "error_during_execution", is_error: true, result: "fake reviewer error" });
} else {
  const notes = [...text.matchAll(/<!--\s*fake-review:\s*FAIL\s+([\s\S]*?)\s*-->/g)].map((m) => m[1]);
  out({
    type: "result",
    subtype: "success",
    is_error: false,
    duration_ms: 1,
    total_cost_usd: 0,
    result: "",
    structured_output: notes.length ? { verdict: "FAIL", notes } : { verdict: "PASS", notes: [] },
  });
}
