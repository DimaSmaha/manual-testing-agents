// Deterministic criteria of stage 4 (expl1-4-qa-test-cases). Base: the structure validator (lib/validators.ts). Extra: the writing
// rules and the Statistics block of references/test-case-design-rules.md and output-template.md that a script can see.
// The content review (coverage, contradictions, invention) is an LLM criterion: the existing reviewer subagent, see run-eval.
import type { CheckCtx, Criterion } from "../lib/types";
import { artifactOf, artifactPath, fail, findWords, fromProblems, FORBIDDEN_WORDS, pass } from "../lib/check-util";
import { getMd, validate } from "../lib/validators";

const SUFFIX = "4-test-cases.md";
const TC_HEADING = /^###\s+(?:\*\*)?(TC-REQ-\d+[a-zA-Z]?\.\d+)(?:\*\*)?\s*:?\s*(.*?)\s*$/;
const STRUCTURAL_NOTE = /^>\s*(?:[^\sA-Za-z]+\s*)?(Structural requirement|The requirement needs clarification)/i;

interface Tc {
  id: string;
  name: string;
  line: number;
  precondition: string | null;
  rows: { step: string; data: string; expected: string; line: number }[];
}
interface Sec {
  id: string;
  line: number;
  tcs: Tc[];
  notes: string[];
}
interface Parsed {
  secs: Sec[];
  tcs: Tc[];
  body: string[]; // lines from the first requirement section up to "## Statistics"
  stats: string[];
}

function parse(ctx: CheckCtx): Parsed | null {
  const md = artifactOf(ctx, SUFFIX);
  if (md === null) return null;
  const { toLines, section, reqHeadings } = getMd();
  const lines = toLines(md);
  const heads = new Map(reqHeadings(lines, 2).map((h) => [h.line, h]));
  const secs: Sec[] = [];
  const tcs: Tc[] = [];
  let cur: Sec | null = null;
  let tc: Tc | null = null;
  let first = -1;
  let last = lines.length;
  lines.forEach((l, i) => {
    if (/^##\s+Statistics\b/i.test(l)) last = Math.min(last, i);
    const h = heads.get(i + 1);
    if (h) {
      cur = { id: h.id, line: i + 1, tcs: [], notes: [] };
      secs.push(cur);
      tc = null;
      if (first < 0) first = i;
      return;
    }
    if (/^##\s/.test(l)) {
      cur = null;
      tc = null;
      return;
    }
    const m = TC_HEADING.exec(l);
    if (m) {
      tc = { id: m[1]!, name: m[2]!, line: i + 1, precondition: null, rows: [] };
      tcs.push(tc);
      cur?.tcs.push(tc);
      return;
    }
    if (/^###\s/.test(l)) {
      tc = null;
      return;
    }
    if (cur && !tc && /^\s*>/.test(l)) cur.notes.push(l.trim());
    if (!tc) return;
    const pre = /^\*\*Precondition:\*\*\s*(.*)$/.exec(l);
    if (pre) tc.precondition = pre[1]!.trim();
    else if (/^\s*\|\s*\d+\s*\|/.test(l)) {
      const cells = l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
      tc.rows.push({ step: cells[1] ?? "", data: cells[2] ?? "", expected: cells[3] ?? "", line: i + 1 });
    }
  });
  const stats = section(lines, "Statistics");
  return { secs, tcs, body: first < 0 ? [] : lines.slice(first, last), stats: stats.lines };
}

export const criteria: Criterion[] = [
  {
    id: "s4.structure",
    description: "Structure (lib/validators.ts): one section per REQ of expected.reqs, numbering, steps table, at least expected.min_test_cases, finished file",
    run(ctx) {
      if (artifactOf(ctx, SUFFIX) === null) return fail(`${ctx.key}-${SUFFIX} was not written`);
      const r = validate("test-cases", artifactPath(ctx, SUFFIX), ctx.c.expected);
      if (r.unverified) return fail(`UNVERIFIED: ${r.unverified}`);
      if (r.pending) return fail(`unfinished: ${r.pending}`);
      return fromProblems(r.errors, "structure ok");
    },
  },
  {
    id: "s4.statistics",
    description: "The Statistics numbers equal the counted requirements, notes and test cases",
    run(ctx) {
      const p = parse(ctx);
      if (p === null) return fail(`${ctx.key}-${SUFFIX} was not written`);
      if (p.stats.length === 0) return fail('no "## Statistics" section');
      const num = (re: RegExp): number | null => {
        for (const l of p.stats) {
          const m = re.exec(l);
          if (m) return Number(m[1]);
        }
        return null;
      };
      const covered = num(/Requirements covered:\s*(\d+)/i);
      const clar = num(/Requirements needing clarification:\s*(\d+)/i);
      const total = num(/Total number of test cases:\s*(\d+)/i);
      const struct = num(/Structural requirements[^:]*:\s*(\d+)/i);
      const noTc = p.secs.filter((s) => s.tcs.length === 0);
      const clarCount = noTc.filter((s) => s.notes.some((n) => /needs clarification/i.test(n))).length;
      const structCount = noTc.filter((s) => s.notes.some((n) => /structural requirement/i.test(n))).length;
      const problems: string[] = [];
      if (total === null) problems.push('no "Total number of test cases" line');
      else if (total !== p.tcs.length) problems.push(`Total number of test cases is ${total}, counted ${p.tcs.length}`);
      if (clar === null) problems.push('no "Requirements needing clarification" line');
      else if (clar !== clarCount) problems.push(`Requirements needing clarification is ${clar}, counted ${clarCount}`);
      if (struct !== null && struct !== structCount) problems.push(`Structural requirements is ${struct}, counted ${structCount}`);
      if (covered === null) problems.push('no "Requirements covered" line');
      else {
        const want = p.secs.length - clarCount - (struct !== null ? structCount : 0);
        if (covered !== want) problems.push(`Requirements covered is ${covered}, counted ${want} (${p.secs.length} sections)`);
      }
      return fromProblems(problems, `${p.secs.length} requirements, ${p.tcs.length} test cases`);
    },
  },
  {
    id: "s4.scenario-names",
    description: 'Scenario names: no "Verify that / Check / Should", no ids, no "and then"',
    run(ctx) {
      const p = parse(ctx);
      if (p === null) return fail(`${ctx.key}-${SUFFIX} was not written`);
      const problems: string[] = [];
      for (const t of p.tcs) {
        if (/^(verify|check|should)\b/i.test(t.name)) problems.push(`${t.id}: name starts with "${t.name.split(" ")[0]}"`);
        if (/\b(TC|REQ)-\d/i.test(t.name)) problems.push(`${t.id}: id inside the name`);
        if (/\b(and then|then)\b/i.test(t.name)) problems.push(`${t.id}: name joins outcomes with "then"`);
        if (t.name === "") problems.push(`${t.id}: empty name`);
      }
      return fromProblems(problems, `${p.tcs.length} names`);
    },
  },
  {
    id: "s4.no-placeholders",
    description: "No `<...>`, `${...}`, TBD or TODO in a finished test case (`[test data]` and `<br>` are fine)",
    run(ctx) {
      const p = parse(ctx);
      if (p === null) return fail(`${ctx.key}-${SUFFIX} was not written`);
      const problems: string[] = [];
      p.body.forEach((l) => {
        const hit = /<(?!br\s*\/?>)[^<>\n]{1,60}>|\$\{[^}]*\}|\bTBD\b|\bTODO\b/.exec(l);
        if (hit) problems.push(`placeholder ${JSON.stringify(hit[0])} in ${JSON.stringify(l.trim().slice(0, 70))}`);
      });
      return fromProblems(problems);
    },
  },
  {
    id: "s4.vague-expected",
    description: "No vague word (correctly, properly, appropriate, if needed, several …) in an expected result",
    run(ctx) {
      const p = parse(ctx);
      if (p === null) return fail(`${ctx.key}-${SUFFIX} was not written`);
      const problems = p.tcs.flatMap((t) => t.rows.flatMap((r) => findWords(r.expected, FORBIDDEN_WORDS).map((w) => `${t.id} step ${r.line}: "${w}"`)));
      return fromProblems(problems, `${p.tcs.reduce((n, t) => n + t.rows.length, 0)} expected results scanned`);
    },
  },
  {
    id: "s4.structural-note",
    description: "A requirement without test cases carries the structural or the needs-clarification `>` note",
    run(ctx) {
      const p = parse(ctx);
      if (p === null) return fail(`${ctx.key}-${SUFFIX} was not written`);
      const problems = p.secs
        .filter((s) => s.tcs.length === 0 && !s.notes.some((n) => STRUCTURAL_NOTE.test(n)))
        .map((s) => `## ${s.id} (line ${s.line}) has no test cases and no "> ℹ️ Structural requirement …" / "> ⚠️ The requirement needs clarification …" note`);
      return fromProblems(problems);
    },
  },
  {
    id: "s4.steps-mechanical",
    description: "Steps are mechanical actions: no verify / make sure / ensure / assert in a step; the assertion is in the expected result",
    run(ctx) {
      const p = parse(ctx);
      if (p === null) return fail(`${ctx.key}-${SUFFIX} was not written`);
      const problems = p.tcs.flatMap((t) =>
        t.rows.filter((r) => /\b(verify|make sure|ensure|assert)\b/i.test(r.step)).map((r) => `${t.id} step at line ${r.line}: assertion in the step (${JSON.stringify(r.step.slice(0, 60))})`),
      );
      return fromProblems(problems);
    },
  },
  {
    id: "s4.precondition",
    description: "Every test case has a non-empty precondition and at least one step with an expected result",
    run(ctx) {
      const p = parse(ctx);
      if (p === null) return fail(`${ctx.key}-${SUFFIX} was not written`);
      const problems: string[] = [];
      for (const t of p.tcs) {
        if (!t.precondition) problems.push(`${t.id}: no precondition`);
        if (t.rows.every((r) => r.expected === "" || r.expected === "—")) problems.push(`${t.id}: no step has an expected result`);
      }
      return p.tcs.length === 0 ? pass("no test cases to check") : fromProblems(problems, `${p.tcs.length} test cases`);
    },
  },
];
