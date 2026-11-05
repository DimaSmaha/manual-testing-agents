---
name: expl1-2-requirements-grooming
description: >
  Second stage of task processing. Takes the context file created by the
  expl1-1-task-context skill and analyzes the requirements through a QA lens as in grooming:
  checks coverage, clarity, contradictions, risks, and missing details
  in the requirements. Numbers the requirements and produces a file of processed
  requirements as input for the following skills.
---

# Requirements Grooming

> ⚙️ Recommended settings: **Opus · Effort: High · Extended thinking: On**

Analyzes the requirements from the context file through a QA lens as in grooming,
finds problems, aligns with the user, and produces
the final numbered list of requirements — input for the following skills.

## Input

Input — the context file `<ISSUEKEY>-1-context.md` created by the
context-collection skill (expl1-1-task-context). In the same chat the file is available
in `.workflow-artifacts/<ISSUEKEY>/` automatically. If the chat is new — the user
uploads the file to the chat.

> ⚠️ CONFIGURE: replace "expl1-1-task-context" with the exact name of the skill that collects
> context in your chain.

Data sources for this skill:
- the context file (source of truth)
- attachments referenced by the context file, if needed
  to understand the requirements
- the user's answers to grooming questions

Do not go to the tracker, do not use external tools,
do not search the internet. The context file is the only source of truth.

The context file is read-only. Do not change, rewrite,
or clean up its content.

If the context file is corrupted, duplicated, or internally
contradictory — stop and tell the user that the context must be
regenerated with the context-collection skill.

## Rules

- All communication and all output file content — in English.
- Chat messages are short.
- Analyze only what is in the context file. Do not invent,
  supplement, or interpret requirements on your own.
- Do not turn ambiguity into fact.
- Preserve the original meaning of requirements during analysis.
  Do not improve, rephrase, or simplify the wording
  on your own. A requirement may be rewritten only after
  agreement with the user.
- Related context from the tracker is background only. Do not create findings
  just because a linked task has different wording
  or additional requirements.
- Do not generate findings artificially. If a requirement is clear and covered —
  it is covered.
- After saving the file — stop. Do not continue into the checklist,
  test cases, or planning.

## Requirement numbering

Assign a sequential ID to each item from the "Requirements" section of the context file:
REQ-1, REQ-2, REQ-3...

Numbering is sequential, with no gaps, in the order the items
appear in the context file.

If during grooming a requirement contains several different things —
split it into sub-items: REQ-5a, REQ-5b. The main number
is kept, sub-items are added.

These IDs are permanent — they do not change throughout the work
of all following skills in the chain. REQ-5 in the grooming file
is the same REQ-5 in the checklist, in the code review, and onward.

## Grooming method

For each requirement from the context file, go through four questions:

1. **Can I verify this?**
   Is there enough specificity: expected result, screen,
   state, condition, trigger. If not — the requirement is not covered.

2. **What do I need for this?**
   Is it clear what data, access, role, and system state are needed.
   If it is unclear from the context — a clarification question.

3. **Where can this break?**
   Check through the lens of test design:
   - Boundary values: is it described what happens at and beyond the boundary
   - States and transitions: are all states described, all valid
     and invalid transitions between them
   - Combinations of conditions: if there are several conditions (role + status +
     data state), is the behavior described for each combination
   - User classes: is behavior separated for different
     roles, account types, access levels
   - Negative scenarios: what if the data is empty, deleted,
     in an invalid state, the action is cancelled
   - Parallel actions: what if the state changed while the user
     was on the page

4. **What is not specified?**
   - Alternative and exceptional scenarios (the main flow exists,
     but what if something goes wrong?)
   - Dependencies between features: does the change affect
     other flows
   - Contradictions between requirements in the context file

Broad or vague wording is a signal to check deeper.
Examples: "where applicable", "all places", "update the wording",
"appropriate messages", "handle", "support".

### Application rules

- Every requirement goes through all 4 questions, but record
  the result only where the question is relevant. Do not generate
  problems artificially for simple or unambiguous requirements.
- After checking individual requirements — check related groups:
  requirements that describe one flow, one screen, or one feature.
  At the joints between related requirements there may be gaps
  that are not visible when checking each one separately.
- If several requirements describe variants of one behavior —
  check whether all variants are covered, including those
  that are not stated explicitly (negative, alternative, exceptional).
- Record only what really affects implementation,
  testing, or acceptance of the task. A question that will change
  neither code, nor test, nor the acceptance result — do not record.
- Do not generate questions about:
  - implementation details that the developer decides (architecture,
    libraries, cache, performance) unless it is stated
    in the requirements as a requirement
  - standard browser or platform behavior
    (opening a tab, scroll, focus)
  - UX details that do not affect functionality
    (animations, timings) unless they are stated in the requirements
  - general infrastructure (server errors, timeouts,
    retries, logging, network failures) unless the ticket
    is specifically about this
  - things that are obvious from the task or product context —
    do not re-ask what is already clear

## Workflow

1. Read the context file in full.
2. If anything is unclear about the product, the feature, or the context
   of the task — ask the user before starting grooming.
   Do not start grooming until you understand the context.
   Do not ask about what is obvious from the context or what does not affect
   grooming the requirements.
3. After receiving the answers — start grooming the requirements.
4. Number all requirements: REQ-1, REQ-2...REQ-N.
5. Groom each requirement using the grooming method.
6. In the chat, write only the problematic requirements, grouped
   by category: questions, contradictions, potential bugs,
   uncovered requirements, risks. One REQ may appear
   in several categories. Each problem — briefly:
   the essence of the problem and what is needed to resolve it.
   Do not mention covered requirements.

   Chat format:

   ### Questions
   - REQ-3: <essence of the problem> → <what is needed to resolve it>

   ### Contradictions
   - REQ-5: <essence> → <what is needed>

   ### Potential bugs
   - REQ-7: <essence> → <what is needed>

   ### Uncovered requirements
   - REQ-9: <essence> → <what is needed>

   ### Risks
   - REQ-7: <essence> → <what is needed>

   Do not write empty categories.
7. Wait for the user's answers, agree on decisions.
   If the user cannot answer or says to skip —
   leave the requirement as is, unchanged.
8. Build the final list: covered requirements unchanged +
   problematic requirements rewritten with the agreements applied.
   Copy the "Goal" section from the context file unchanged —
   the following skills need it to understand the context.
9. Save one file — a clean numbered list
   of ready requirements.

## Output file

Create the file `.workflow-artifacts/<ISSUEKEY>/<ISSUEKEY>-2-requirements.md`
and tell the user the path.

The file stays in `.workflow-artifacts/<ISSUEKEY>/` — the next skill
in the same chat picks it up automatically.

If the file already exists — delete it completely and create a new one.

The template is in references/output-template.md.

## Final response

After saving the file, report the path to the saved file.
