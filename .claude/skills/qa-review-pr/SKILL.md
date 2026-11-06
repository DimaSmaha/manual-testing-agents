---
name: qa-review-pr
description: >
  Optional helper after the QA pipeline (expl1-*). Reviews the PR of one task as a QA
  engineer from the pipeline artifacts and the PR code: is the task done, does it break
  existing behavior, what are the merge risks, and which scenarios must be verified. Writes a
  short verdict file (180 words at most). Use when the user says "review this PR as QA",
  "PR verdict", "is this PR safe to merge?", "what should we test in this PR?", or when the
  expl1-orchestrator offers it after stage 8. Adapted from testomatio/skills (MIT).
author: Testomat.io (adapted)
---

# QA Review of a Pull Request

> ⚙️ Recommended settings: **Opus · Effort: High · Extended thinking: On**

Think about the change like a senior QA engineer and give a short verdict a person who does not read
code can act on. This is an optional helper, not a numbered pipeline stage: it needs no stage
before it, but it is most useful after stages 2 and 5–8.

## Input

Required from the user (ask only for what is missing):
- `<ISSUEKEY>` (`TASK-<id>` or `BUG-<id>`). If `.workflow-artifacts/` has exactly one task folder
  that matches the chat, use it; otherwise ask.
- PR URL or branch name.

Sources, in this order (use what exists, do not fail on a missing optional file):
1. **The original request:** `<ISSUEKEY>-2-requirements.md` (REQ-N). If it is missing, use
   `<ISSUEKEY>-1-context.md`. If neither exists, use only the PR title and description and say
   so in one line in the chat. Never take the intent from the code.
2. **Pipeline results:** `<ISSUEKEY>-5-pr-summary.md`, `<ISSUEKEY>-6-code-review.md`,
   `<ISSUEKEY>-7-impact-analysis.md`, `<ISSUEKEY>-8-web-testing.md`. A `FAIL`
   (code review) or `FAIL CONFIRMED` (web testing) is a proven defect. `PASS` from the code review
   is a code fact, not a browser fact. A `QA` row that was never tested is not proof of anything.
3. **The PR code:** through the `gh` CLI only (`gh pr view`, `gh pr diff`, `gh api`), PR head only,
   the same way as `expl1-5-pr-summary`. If the CLI is unavailable — stop and tell the user.
   Do not use git clone, curl or the browser as a replacement.

Do not use the tracker and do not search the internet.

## Rules

- English only. Chat messages are short.
- Read-only: do not change code, and do not post PR comments, reviews, labels or statuses.
- No invented data. Every finding rests on a source above. A closed ticket or a "PASS" comment
  is not evidence of working behavior.
- A requirement that the PR delivers only partly (a slice of the task) is not a defect by itself.
  Say which part is missing under `Is it done`.
- After saving the file — stop.

## Think

- Does the implementation represent the original task or requirement.
- Possible ambiguities in the implementation.
- Possible contradictions with existing practices and features.
- Possible duplication of existing features or patterns.
- Unobvious usage: edge cases, repeated actions, boundary values, cancellations.
- Combinations: how the change interacts with other features.
- Security vulnerabilities.

## Prioritize facts

- Every finding appears in exactly one section. Never restate a finding in another section.
- A defect proven by the code or by the browser goes to `Is it done` or `Merge Risks`, not both.
- Anything not proven goes to `What must be verified` as a scenario, or is dropped.
- Order every list by impact on end users, most severe first.
- Limits are maximums, not targets. Fewer points are better than padded ones.
- Whole review: at most 180 words. If over, drop the lowest-severity item.

## Output style

- A person who does not read code must understand it. Use QA language, not coding jargon.
- No internal variable names, syntax or queries. Class and file names only when needed, never deeper.
- Never mention HTTP status codes, test coverage or unit tests.
- Explain risks and ambiguities in terms of the persona using the software.
- Resolve ambiguities from the requirements and the code where you can.
- State facts directly. No hedging words: "may", "might", "possibly", "unverified".
- Bold only the key point of each item. Short sentences.
- Reply with only the requested sections, named exactly as below. No preface, no conclusion.
- Cite `REQ-N` where a point comes from a requirement. Do not create new IDs.

## Requested sections

- `Is it done`: does the change meet the original request.
  - Verdict is `Yes`, `No` or `Partially`.
  - If the reported problem still reproduces on any path, the verdict is `Partially`, never "Yes, with a caveat".
  - If any `Merge Risks` point says the original problem still happens somewhere, the verdict is `Partially`.
  - Issue summary: at most 15 words. Reasoning: at most 30 words.
- `Backwards Compatibility`: does the change alter the behavior of existing features for existing users.
  - If not, write one sentence and stop.
  - New optional inputs and their new errors are not compatibility issues.
- `Merge Risks`: problems that merging introduces, proven by the code or the browser.
  - At most 3 points. An empty section is allowed: write `No risks found`.
  - Each point: **impact on the user, at most 8 words** — who hits it and when, at most 15 words.
- `What must be verified`: at most 4 riskiest usage scenarios for end users.
  - Each: **What if {persona} {action}** — expected result, at most 10 words.
  - Skip scenarios that are technical and can be covered by a unit test.
  - Skip scenarios already confirmed by `<ISSUEKEY>-8-web-testing.md`.

## Output file

Create `.workflow-artifacts/<ISSUEKEY>/<ISSUEKEY>-x-pr-verdict.md` (create the folder if it does not
exist) and tell the user the path. If the file exists — delete it completely and create a new one.

```
# PR verdict: <ISSUEKEY>

PR: <URL or branch> · Sources: <list of files used>

## Is it done

**<Yes | No | Partially>.** <original issue summary, ≤ 15 words>

<reasoning, ≤ 30 words>

## Backwards Compatibility

<'No breaking changes.' + why, ≤ 15 words — OR one line per changed existing behavior>

## Merge Risks

1. **<impact on the user, ≤ 8 words>** — <who hits it and when, ≤ 15 words>

<0 to 3 points, most severe first, or 'No risks found'>

## What must be verified

- **What if <persona> <action>** — <expected result, ≤ 10 words>

<up to 4 scenarios, riskiest first>
```

The heading lines above are not counted in the 180 words.

## Final response

After saving, report in chat: the path, the verdict (`Yes` / `No` / `Partially`), and the number of
merge risks and scenarios.
