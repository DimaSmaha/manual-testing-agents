# Checklist building rules — reference

Sources: ISTQB CTFL v4.0, ISTQB CTAL-TA v4.0,
generally accepted requirements-based testing practices.

## What a checklist item is

Per ISTQB, a test condition is an aspect or event of a component
or system that can be verified by one or more
test cases. A checklist item is an atomic test condition
with an unambiguous expected result.

A checklist item answers the question: "what to verify
and what result is expected". A test case (the next skill)
answers "how to verify".

## Quality attributes of an item

### Atomicity
One item = one check with one pass/fail.
"The button is visible and clickable" — two items.
If an item can be "partially pass" — split it further.

### Traceability
Every item has a REQ-ID. Every requirement has at least one
item. There are no items without a source and no requirements
without any check.

### Unambiguity
One interpretation. Any two people reading the item
must reach the same pass/fail conclusion.

### Self-containment
The item is understandable without opening the requirements file
and without the context of other items.

### Independence
The item can be verified on its own. Not "after performing
REQ-1.2 the results are updated", but "when a state is selected
the results are updated".

### No duplication
One check is not repeated in different items,
even under different REQ-IDs.

### Consistency
Elements of the same type get an identical base set
of checks. The difference is only in the specific checks
on top of the base set.

## Wording rules

An item consists of two parts:
- What is verified (element, state, behavior)
- What the expected result is (value, state, text)

Both parts are mandatory. An item without an expected
result is not a check.

### Forbidden words

They make a check ambiguous — do not use:
- "correctly", "properly", "appropriately"
- "relevant", "adequate", "acceptable"
- "if needed", "if necessary"
- "several", "some", "enough"
- "quickly", "smoothly", "conveniently", "fast", "user-friendly"
- "looks good", "works fine", "should work", "as needed"

Instead of them — a specific value, state, text, number.

## Decomposing a requirement into items

### Process per ISTQB

Test Analysis: requirement → test conditions (aspects
that need to be verified). Each test condition becomes
a checklist item.

For each requirement, determine in order:
1. Which elements or states the requirement describes
2. Which actions or behaviors the requirement describes
3. Which conditions or constraints the requirement describes
4. Whether there are dependencies on other requirements

Each item from steps 1-4 that has an unambiguous pass/fail
becomes a checklist item.

### Check types

Not every type applies to every requirement —
generate only those that follow from the specific requirement.

**Positive scenario** — the main behavior works
as described (happy path). Always applicable.

**Negative scenario** — behavior on invalid actions
or data. Only when the requirement describes interactivity.

**Boundary values** — behavior at the limits. Only when
the requirement describes numeric or text constraints.

**Default state** — the initial state before user
actions. Only when the requirement describes an element
with an initial state.

**Element states** — visibility, activity depending
on conditions. Only when the requirement describes conditional behavior.

**State transitions** — change of state on an action.
Only when the requirement describes a state change.

**Reset** — return to the initial state.
Only when the requirement describes a reset or clearing.

**Validation** — rules and messages. Only when
the requirement describes validation.

**Data** — fields, formats, mappings. Only when
the requirement describes specific fields or data formats.

**Combinations of conditions** — behavior under different combinations.
Only when the requirement contains several independent conditions.

**UI conformance** — labels, texts, placement. Only when
the requirement describes a specific text or position.

### Prompt list for negative and edge checks (optional)

Use only as a prompt to look for what the requirement really describes. Add an item
only when the requirement states the behavior, and never to fill the list:

- empty input or empty state
- duplicate (the same value or record submitted twice)
- too large (over a stated maximum)
- wrong format
- expired or no longer valid
- not allowed for the role
- concurrent change (the state changed while the user was on the page)
- external failure — only when the requirement is about it

### Checks at the joints between requirements

After decomposing each requirement separately — check
groups of related requirements. At the joints between requirements
there may be checks that are not visible when decomposing
a single requirement: dependencies, conflicts, shared states.

## Sufficiency criterion

### Sufficient when
- Every requirement has at least one check
- Every item has exactly one pass/fail
- Every item is understandable without the context of other items
- Elements of the same type have the same base set

### Excessive when
- Items duplicate each other in other words
- 10+ items for a simple requirement with one element
  and one behavior
- An item verifies a detail that is not in the requirement

## Base set for typical elements

The minimum scope for typical UI elements.
Use it as a starting point — generate
only the items that follow from the specific requirement.

**Select:** presence → element type → options →
default state → main action → reset

**Input field:** presence → field type → label →
placeholder (if any) → default value (if any) →
validation (if described) → constraints (if described)

**Button:** presence → text → action on click →
states and transition conditions

**Table / list:** presence → columns/fields →
data is displayed → sorting (if any) →
pagination (if any) → empty state

## Filtering out unnecessary checks

Do not generate checks for:
- standard browser or platform behavior
- implementation details (architecture, cache, libraries)
- general infrastructure (server errors, timeouts)
- boundary values where the requirement describes no constraints
- negative scenarios for requirements without interactivity
- UX details (animations, timings, hover) not described in the requirement
- behavior that is absent from the requirements

## Anti-patterns

**Duplication through rephrasing.**
"The Save button is present" and "The Save button is displayed" —
one item twice. Remove the duplicate.

**Implementation instead of behavior.**
"The API returns 200", "The component uses useEffect" —
the checklist verifies behavior for the user,
not implementation details.

**Non-atomic item.**
"The filter is present and filters the results on selection" —
two items: presence + filtering. Split.

**Dependent item.**
"After performing REQ-1.2 the results are updated" —
the item must be self-contained.

**Invented check.**
"The list loads in 2 seconds" — if the requirement
does not describe performance, the item should not exist.

**Ambiguous wording.**
"Filtering works correctly" — what does "correctly" mean?
Instead: "Selecting the state California displays
only leads from the state California".
