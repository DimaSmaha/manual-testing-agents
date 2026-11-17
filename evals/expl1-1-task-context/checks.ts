// Deterministic criteria of stage 1 (expl1-1-task-context). No validator exists for the context file, so they live here.
// Template: .claude/skills/expl1-1-task-context/references/output-template.md. LLM criteria: grader.md.
import type { CheckCtx, Criterion } from "../lib/types";
import { fail, fromProblems, pass, findWords, artifactOf } from "../lib/check-util";
import { getMd } from "../lib/validators";

const SUFFIX = "1-context.md";
const SECTIONS = ["Goal", "Scope", "Requirements", "Additional requirements (from comments)", "Related context", "Attachments"];
const REQUIRED = ["Goal", "Scope", "Requirements"];
const OPTIONAL = SECTIONS.slice(3);
const PM_WORDS = ["story points", "story point", "estimate", "estimates", "estimation", "sprint", "assignee", "assigned to", "due date", "deadline", "reporter"];

const context = (ctx: CheckCtx): string | null => artifactOf(ctx, SUFFIX);

function h2s(text: string): string[] {
  return getMd()
    .toLines(text)
    .map((l) => /^##\s+(.*?)\s*#*\s*$/.exec(l)?.[1])
    .filter((h): h is string => typeof h === "string");
}

export const criteria: Criterion[] = [
  {
    id: "s1.stop-behavior",
    description: "Empty tracker record -> first reply line `STOP:` and no context file; otherwise a context file and no STOP",
    run(ctx) {
      const file = context(ctx);
      const firstLine = ctx.finalReply.split(/\r?\n/).find((l) => l.trim() !== "") ?? "";
      const stopped = /^\s*STOP:/.test(firstLine);
      if (ctx.c.expected.stop) {
        const problems: string[] = [];
        if (!stopped) problems.push(`first reply line is ${JSON.stringify(firstLine.slice(0, 80))}, expected "STOP: …"`);
        if (file !== null) problems.push(`a context file was written although the tracker record is empty`);
        return fromProblems(problems, "STOP: reply and no context file");
      }
      if (stopped) return fail(`unexpected STOP: ${firstLine.slice(0, 120)}`);
      if (file === null || file.trim() === "") return fail(`${ctx.key}-${SUFFIX} was not written`);
      return pass("context file written");
    },
  },
  {
    id: "s1.one-h1",
    description: "Exactly one top-level heading, `# <KEY> - <title>` with the tracker title",
    run(ctx) {
      if (ctx.c.expected.stop) return null;
      const text = context(ctx);
      if (text === null) return fail("no context file");
      const { toLines, norm } = getMd();
      const h1s = toLines(text).filter((l) => /^#\s/.test(l));
      if (h1s.length !== 1) return fail(`${h1s.length} top-level headings, expected 1`);
      const want = ctx.c.expected.title;
      const got = norm(h1s[0]!.replace(/^#\s+/, ""));
      if (!got.startsWith(`${ctx.key} - `)) return fail(`heading ${JSON.stringify(got)} does not start with "${ctx.key} - "`);
      if (want && norm(got.slice(ctx.key.length + 3)) !== norm(want)) return fail(`title ${JSON.stringify(got.slice(ctx.key.length + 3))} differs from the tracker title ${JSON.stringify(want)}`);
      return pass();
    },
  },
  {
    id: "s1.header",
    description: "Header lines Source / Type / [Severity, bugs only] / Generated, each on its own line, in that order",
    run(ctx) {
      if (ctx.c.expected.stop) return null;
      const text = context(ctx);
      if (text === null) return fail("no context file");
      const lines = getMd().toLines(text);
      const top = lines.slice(0, lines.findIndex((l) => /^##\s/.test(l)) === -1 ? lines.length : lines.findIndex((l) => /^##\s/.test(l)));
      const meta = top.filter((l) => /^[A-Za-z]+:\s/.test(l)).map((l) => l.split(":")[0]!);
      const isBug = ctx.c.kind === "bug";
      const want = isBug ? ["Source", "Type", "Severity", "Generated"] : ["Source", "Type", "Generated"];
      const problems: string[] = [];
      if (meta.join(",") !== want.join(",")) problems.push(`header lines are [${meta.join(", ")}], expected [${want.join(", ")}]`);
      const val = (k: string): string => (top.find((l) => l.startsWith(`${k}:`)) ?? "").slice(k.length + 1).trim();
      const id = ctx.key.split("-")[1]!;
      const source = val("Source");
      if (!new RegExp(`/${isBug ? "bugs" : "tasks"}/${id}$`).test(source)) problems.push(`Source ${JSON.stringify(source)} should end with /${isBug ? "bugs" : "tasks"}/${id}`);
      if (ctx.c.expected.type && val("Type").toLowerCase() !== ctx.c.expected.type.toLowerCase()) problems.push(`Type is ${JSON.stringify(val("Type"))}, expected ${JSON.stringify(ctx.c.expected.type)}`);
      if (isBug && ctx.c.expected.severity && val("Severity").toLowerCase() !== ctx.c.expected.severity.toLowerCase()) problems.push(`Severity is ${JSON.stringify(val("Severity"))}, expected ${JSON.stringify(ctx.c.expected.severity)}`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(val("Generated"))) problems.push(`Generated ${JSON.stringify(val("Generated"))} is not YYYY-MM-DD`);
      return fromProblems(problems, "header ok");
    },
  },
  {
    id: "s1.sections",
    description: "Only template sections, in template order; Goal, Scope and Requirements present; no optional section without data",
    run(ctx) {
      if (ctx.c.expected.stop) return null;
      const text = context(ctx);
      if (text === null) return fail("no context file");
      const got = h2s(text);
      const problems: string[] = [];
      for (const r of REQUIRED) if (!got.includes(r)) problems.push(`missing section "${r}"`);
      const unknown = got.filter((h) => !SECTIONS.includes(h));
      if (unknown.length) problems.push(`sections not in the template: ${unknown.map((u) => JSON.stringify(u)).join(", ")}`);
      const known = got.filter((h) => SECTIONS.includes(h));
      const order = known.map((h) => SECTIONS.indexOf(h));
      if (order.some((n, i) => i > 0 && n < order[i - 1]!)) problems.push(`sections out of template order: ${known.join(" > ")}`);
      if (new Set(known).size !== known.length) problems.push("a section appears twice");
      if (!ctx.c.expected.extra_sections) {
        const extra = got.filter((h) => OPTIONAL.includes(h));
        if (extra.length) problems.push(`optional section(s) without source data in the tracker: ${extra.join(", ")}`);
      }
      return fromProblems(problems, `sections: ${known.join(", ")}`);
    },
  },
  {
    id: "s1.requirement-count",
    description: "Number of bullets under Requirements matches the tracker (expected.requirement_count)",
    run(ctx) {
      const want = ctx.c.expected.requirement_count;
      if (ctx.c.expected.stop || want === undefined) return null;
      const text = context(ctx);
      if (text === null) return fail("no context file");
      const { toLines, section, bullets } = getMd();
      const n = bullets(section(toLines(text), "Requirements")).length;
      const [lo, hi] = Array.isArray(want) ? want : [want, want];
      return n >= lo && n <= hi ? pass(`${n} requirement bullets`) : fail(`${n} requirement bullets, expected ${lo === hi ? lo : `${lo}-${hi}`}`);
    },
  },
  {
    id: "s1.literals",
    description: "Every must-keep literal of the tracker (numbers, quoted labels, roles) appears verbatim",
    run(ctx) {
      const lits = ctx.c.expected.literals;
      if (ctx.c.expected.stop || !lits?.length) return null;
      const text = context(ctx);
      if (text === null) return fail("no context file");
      const { norm } = getMd();
      const hay = norm(text);
      const missing = lits.filter((l) => !hay.includes(norm(l)));
      return missing.length ? fail(`missing literal(s): ${missing.map((m) => JSON.stringify(m)).join(", ")}`) : pass(`${lits.length} literals present`);
    },
  },
  {
    id: "s1.no-pm-data",
    description: "No estimate, story points, sprint, assignee or date fields",
    run(ctx) {
      if (ctx.c.expected.stop) return null;
      const text = context(ctx);
      if (text === null) return fail("no context file");
      const found = findWords(text, PM_WORDS);
      return found.length ? fail(`project-management data in the context: ${found.join(", ")}`) : pass();
    },
  },
  {
    id: "s1.bug-fields",
    description: "Bugs: `Severity:` from the tracker and a retest goal; the bug description is in Requirements as is",
    run(ctx) {
      if (ctx.c.expected.stop || ctx.c.kind !== "bug") return null;
      const text = context(ctx);
      if (text === null) return fail("no context file");
      const { toLines, section, sectionText } = getMd();
      const lines = toLines(text);
      const problems: string[] = [];
      if (!/^Severity:\s*\S/m.test(text)) problems.push("no Severity line");
      if (!/\bretest|\bverify\b|\bverified\b|no longer occur|\bre-test/i.test(sectionText(section(lines, "Goal")))) problems.push("Goal does not state a retest / verify-the-fix outcome");
      if (!/^Type:\s*bug\s*$/im.test(text)) problems.push("Type is not bug");
      return fromProblems(problems, "bug fields ok");
    },
  },
];
