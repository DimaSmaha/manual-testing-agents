// Deterministic criteria of stage 2 (expl1-2-requirements-grooming). The structure validator (lib/validators.ts, the evals'
// own) is the base; the wording check is separate: the structure validator skips wording on purpose (grooming may rewrite
// after the user agrees), but in an autonomous run nobody agrees, so an unsplit requirement must equal its context bullet.
import type { Criterion } from "../lib/types";
import { artifactOf, artifactPath, fail, fromProblems, pass } from "../lib/check-util";
import { getMd, validate } from "../lib/validators";

const SUFFIX = "2-requirements.md";
const GROUPS = ["questions", "contradictions", "potential bugs", "uncovered requirements", "risks"];

export const criteria: Criterion[] = [
  {
    id: "s2.structure",
    description: "Structure (lib/validators.ts): Goal unchanged (expected.goal), REQ-1..N complete (expected.context_requirements), ids unique and ascending",
    run(ctx) {
      if (artifactOf(ctx, SUFFIX) === null) return fail(`${ctx.key}-${SUFFIX} was not written`);
      const r = validate("requirements", artifactPath(ctx, SUFFIX), ctx.c.expected);
      if (r.unverified) return fail(`UNVERIFIED: ${r.unverified}`);
      return fromProblems(r.errors, "structure ok");
    },
  },
  {
    id: "s2.text-unchanged",
    description: "An unsplit REQ-k has exactly the text of context requirement #k (no rewrite without agreement)",
    run(ctx) {
      const md = artifactOf(ctx, SUFFIX);
      const context = ctx.read(`${ctx.key}-1-context.md`);
      if (md === null) return fail(`${ctx.key}-${SUFFIX} was not written`);
      if (context === null) return fail("context file missing in the run folder");
      const { toLines, section, bullets, parseReqs, norm, trunc } = getMd();
      const cl = toLines(context);
      const items = [...bullets(section(cl, "Requirements")), ...bullets(section(cl, /^additional requirements\b/i))];
      const { reqs } = parseReqs(section(toLines(md), "Requirements"));
      const problems: string[] = [];
      items.forEach((item, i) => {
        const k = i + 1;
        const group = reqs.filter((r) => r.base === k);
        if (group.length === 0) return; // s2.structure reports a missing REQ
        const whole = group.find((r) => r.suffix === "");
        if (group.length > 1 || !whole) return; // split into sub-items: allowed, judged by s2.llm-split-faithful
        if (whole.text !== norm(item.text)) problems.push(`REQ-${k} reworded: ${JSON.stringify(trunc(whole.text, 90))} vs context ${JSON.stringify(trunc(item.text, 90))}`);
      });
      return fromProblems(problems, `${items.length} context requirements checked`);
    },
  },
  {
    id: "s2.auto-decision",
    description: "The reply carries an `AUTO-DECISION:` line for the grooming questions left unanswered",
    run(ctx) {
      return /^\s*AUTO-DECISION:/m.test(ctx.reply) ? pass("AUTO-DECISION line present") : fail("no `AUTO-DECISION:` line in the reply");
    },
  },
  {
    id: "s2.problem-list",
    description: "Chat problem list uses only the five group headings, no empty group, entries start with an existing REQ id",
    run(ctx) {
      const md = artifactOf(ctx, SUFFIX);
      const want = ctx.c.expected.min_problems ?? 0;
      const lines = ctx.reply.split(/\r?\n/);
      const groups: { name: string; entries: string[] }[] = [];
      let open: { name: string; entries: string[] } | null = null; // the group heading whose bullets are being read
      for (const l of lines) {
        const h = /^#{2,4}\s+(.+?)\s*$/.exec(l);
        if (h) {
          const name = h[1]!.toLowerCase();
          open = GROUPS.includes(name) ? { name, entries: [] } : null; // another heading ends the group
          if (open) groups.push(open);
          continue;
        }
        const b = /^\s*[-*]\s+(.*)$/.exec(l);
        if (b && open) open.entries.push(b[1]!);
        // Any other non-empty, non-indented line ("AUTO-DECISION: …", "Files are in …:") ends the group, so a bullet list
        // later in the reply (a list of saved files) is not read as problems.
        else if (open && l.trim() !== "" && !/^\s/.test(l)) open = null;
      }
      const named = groups.filter((g) => g.name);
      const problems: string[] = [];
      for (const g of named) if (g.entries.length === 0) problems.push(`group "${g.name}" is empty (empty categories must not be written)`);
      const ids = new Set<number>();
      if (md !== null) {
        const { toLines, section, parseReqs } = getMd();
        for (const r of parseReqs(section(toLines(md), "Requirements")).reqs) ids.add(r.base);
      }
      let total = 0;
      for (const g of named) {
        for (const e of g.entries) {
          total += 1;
          const m = /^\**REQ-(\d+)[a-z]?\b/.exec(e);
          if (!m) problems.push(`entry in "${g.name}" does not start with a REQ id: ${JSON.stringify(e.slice(0, 60))}`);
          else if (ids.size && !ids.has(Number(m[1]))) problems.push(`entry names REQ-${m[1]}, which is not in the requirements file`);
        }
      }
      if (total < want) problems.push(`${total} problems listed, expected at least ${want}`);
      return fromProblems(problems, `${total} problems in ${named.length} group(s)`);
    },
  },
];
