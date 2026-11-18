// Token counts of an eval trial. Same field names as the `billed` block of the run metrics
// (.claude/hooks/lib/transcript-usage.mjs: input / output / cache_read / cache_write / total), so an eval row
// can be read next to a row of `<KEY>-metrics.md`. The numbers come from the `result` message of the Agent SDK
// (`modelUsage`, summed over every model and subagent of the trial), not from a transcript: eval trials run with
// persistSession:false and the metrics hooks are off (EXPL1_REVIEW_CHILD=1), so no transcript exists to read.
import type { Tokens } from "./types";

export const noTokens = (): Tokens => ({ input: 0, output: 0, cache_read: 0, cache_write: 0, total: 0 });

export function addTokens(a: Tokens, b: Tokens | undefined): Tokens {
  if (!b) return a;
  const t = { input: a.input + b.input, output: a.output + b.output, cache_read: a.cache_read + b.cache_read, cache_write: a.cache_write + b.cache_write, total: 0 };
  t.total = t.input + t.output + t.cache_read + t.cache_write;
  return t;
}

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** Sum the `modelUsage` map of an SDK `result` message (camelCase keys, one entry per model). */
export function tokensFromModelUsage(modelUsage: unknown): Tokens {
  let t = noTokens();
  if (!modelUsage || typeof modelUsage !== "object") return t;
  for (const u of Object.values(modelUsage as Record<string, Record<string, unknown>>)) {
    t = addTokens(t, {
      input: num(u["inputTokens"]),
      output: num(u["outputTokens"]),
      cache_read: num(u["cacheReadInputTokens"]),
      cache_write: num(u["cacheCreationInputTokens"]),
      total: 0,
    });
  }
  return t;
}

/** Sum a CLI `--output-format json` `usage` object (snake_case), as returned by the reviewer subagent run. */
export function tokensFromCliUsage(usage: unknown): Tokens {
  if (!usage || typeof usage !== "object") return noTokens();
  const u = usage as Record<string, unknown>;
  return addTokens(noTokens(), {
    input: num(u["input_tokens"]),
    output: num(u["output_tokens"]),
    cache_read: num(u["cache_read_input_tokens"]),
    cache_write: num(u["cache_creation_input_tokens"]),
    total: 0,
  });
}

export const fmtTokens = (t: Tokens): string => `${t.total.toLocaleString("en-US")} tok (in ${t.input.toLocaleString("en-US")} · out ${t.output.toLocaleString("en-US")} · cache r ${t.cache_read.toLocaleString("en-US")} · cache w ${t.cache_write.toLocaleString("en-US")})`;
