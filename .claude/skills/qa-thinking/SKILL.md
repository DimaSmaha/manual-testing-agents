---
name: qa-thinking
description: >
  Optional helper for the QA pipeline (expl1-*). Reviews the groomed requirements (and the PR,
  if there is one) from a QA risk perspective: what must be acknowledged, up to 5 "What if"
  questions to clarify, and up to 5 risk scenarios to verify. Use when the user says "what could
  go wrong?", "what am I missing?", "review this as QA", "risk questions", or when the
  expl1-orchestrator offers it after stage 2. Adapted from testomatio/skills (MIT).
author: Testomat.io (adapted)
---

# QA Thinking

> ⚙️ Recommended settings: **Sonnet · Effort: Medium · Extended thinking: Off**

Think about a feature like a senior QA engineer and surface risk scenarios, then explain them to
the person who builds or tests the feature. This is a critical review that asks clarifying
questions. It does not write test cases or a checklist (stages 3 and 4 do that) and it does not
change the requirements.

## Input

Ask only for what is missing:
- `<ISSUEKEY>` (`TASK-<id>` or `BUG-<id>`), or the feature description in chat if there is no task.
- Optional: PR URL or branch name.

Sources (use what exists):
1. `.workflow-artifacts/<ISSUEKEY>/<ISSUEKEY>-2-requirements.md` (REQ-N). If missing, use
   `<ISSUEKEY>-1-context.md`. If neither exists, use the text the user gave in chat.
2. If a PR is given: the `gh` CLI only (`gh pr view`, `gh pr diff`), PR head only. If the CLI is
   unavailable — skip the code and say so in one line.
3. If the current behavior of the feature is unclear and the user wants it established, suggest the
   `qa-explain-behavior` skill. Do not run it yourself.

## Rules

- English only. Chat messages are short.
- Read-only. Do not change requirements or any pipeline artifact.
- No invented data. A risk must follow from the requirement text, the PR or the context. Do not add
  generic QA advice that is not tied to this feature.
- Cite the existing `REQ-N` for each point that comes from a requirement. Do not create new IDs.
- Security: raise it only when the feature touches input, permissions, money, personal data or
  external access.

## Think as QA

- What the feature is about.
- How it aligns with existing features, common project patterns and business intent.
- Whether a similar pattern is already implemented (are we duplicating existing behavior).
- Negative scenarios: possible misuse and failures.
- Unobvious usage: edge cases, boundary values, cancellation during execution.
- Combinations: how the feature interacts with other features.
- Security vulnerabilities (see the rule above).

## Output file

Create `.workflow-artifacts/<ISSUEKEY>/<ISSUEKEY>-x-risk-questions.md` and tell the user the path.
If there is no task key, show the three sections in chat and do not write a file. If the file
exists — delete it completely and create a new one.

Only these three sections, named exactly like this, each as a numbered list. Simple wording, short
sentences.

```
# Risk questions: <ISSUEKEY>

## Must be acknowledged
<brief summary in bullet points, correlation with other areas, potential risks>

## Must be clarified
<up to 5 questions that resolve important ambiguities; start each with "What if">

## Must be verified
<up to 5 most important risk scenarios, no more>
```

The questions in `Must be clarified` are for the user. Do not answer them on the user's behalf.

## Next actions

After saving, offer in one short line:
- Requirement defects found → re-run `expl1-2-requirements-grooming`.
- Turn the scenarios into checks or test cases → continue with stages 3–4.

## Final response

Report the path and the counts (acknowledged items, questions, scenarios).
