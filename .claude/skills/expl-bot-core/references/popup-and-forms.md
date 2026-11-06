# Popups, overlays and forms (ported from `unexpectedPopupRule`, `formRequirementsRule`, `credentialsRule`)

## Unexpected popup / overlay

If a modal or popup appears that you did not expect, dismiss it before continuing with the task.

- Signs of an overlay: elements become hidden or unclickable; a click error mentions "intercepts pointer
  events" (another element covers the target); buttons are disabled for no visible reason.
- If the app explains why a control is disabled (tooltip, hint text), trust that explanation over your own
  guess. Otherwise check for a blocking popup or empty required fields.
- Dismiss strategy, in this order — after each step take a snapshot and see whether the overlay is gone:
  1. `press Escape`
  2. click `Cancel`
  3. click the close control: `getByRole('button', { name: 'Close' })`
  4. click outside the dialog (`mousemove`/`mousedown`/`mouseup` at 5,5)
- A cookie banner / consent dialog is a popup too. Dismiss it with the least-commitment button ("Reject
  non-essential", "Close"). Do not accept terms or subscribe to anything on the user's behalf.
- A browser dialog (alert / confirm / prompt): read its text, record it, then `dialog-accept` or
  `dialog-dismiss`. A dialog that would delete or change data of a record the run did not create:
  `dialog-dismiss` and report BLOCKED.

## Forms that persist data

Before filling a create/update form, read each control's requirements: required, type/format, length,
placeholder, `aria-describedby` hints, `min`/`max`/`pattern`. Enter values that satisfy them. Read them from
the snapshot, or with
`eval "el => ({required: el.required, type: el.type, max: el.maxLength, min: el.min, pattern: el.pattern, placeholder: el.placeholder})" <ref>`.

Search / filter / sort forms that only change the view do not need this (the psycho style does the opposite on
purpose, see `planner-styles/psycho.md`).

- Before submitting, verify every input holds what you entered (one `snapshot` or `eval` per important field).
- After filling, press the explicit save/submit control. A form that was only filled is not saved.
- If the URL is already a create/edit form and the scenario is about that entity, fill and submit it. Do not
  click the list-page "New" button again from inside the form.
- If the scenario is about search / filter / sort / tabs / list inspection and the current URL is a
  create/edit form, go back to the stable list page first.
- When selecting related entities from a list, do not pick rows or options marked "0 items" / "0 results" if
  the scenario needs real content.

## Credentials

Sign in to an existing account only with credentials present in the user's chat message, the knowledge files
or `EXPL_BOT_AUTH`. Never invent, guess or try default, common or placeholder credentials. If the required
credentials are not provided: stop and name what is missing; do not submit the form.
In the interactive flow the user logs in in the open headed window (`expl1-8` "Asking the user for help").

## Errors that are not part of the scenario

- 404 / "Not Found" / error page you did not navigate to on purpose: return to the start URL (`goto`) and try
  again. This is the only allowed use of `reset`.
- Server error (500, 503…): record it as a failed observation with the URL, `console` output, then go back to
  the start URL and continue.
- The page is blank or barely rendered: wait for a concrete element, not for time. Take a second snapshot. If
  it stays blank after `reload`, report the page as not loading.
