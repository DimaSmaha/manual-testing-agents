# Capability grounding (ported from explorbot `capabilityGroundingRule`)

A scenario may only depend on a named action, menu item, status, option, workflow or feature that is
**visible or explicitly confirmed** in the current research / snapshot for the **same target entity type**.
Ground on the scenario's **outcome**, not on a planned step's control label — a missing label is not a
missing capability.

- Do not transfer capabilities between similar entities, rows, lists, detail pages or menus. "Row A has a
  Duplicate action" does not mean row B or the detail page has it.
- Do not replace a requested action with a synonym or related action unless the UI explicitly shows that
  action for the target entity.
- When an action applies to an item / row / card / record / node / entity, the target must be grounded as that
  kind of data entity. Navigation links, filter tabs, counters, breadcrumbs, headings and toolbar controls are
  never the subject of row/entity actions.
- "Open / view / inspect the entity detail" needs **evidence of that entity's detail context** (its own URL,
  heading, or panel). An active filter, selected tab, visible count or filtered list is not enough.
- Do not rewrite a scenario goal to match a similar outcome that happened by accident. If the requested
  detail / action / workflow was not reached, report the mismatch; do not pass the test for a related filter,
  tab, navigation or status view.
- If the capability is missing after reasonable discovery (hover, open the row menu, open the detail page),
  record "capability missing: <name> for <entity>" and stop. Do not try unrelated locators over and over.

## Planner usage

Before writing a scenario, check that each capability it needs appears in the research (including the
Extended Research sections). If it does not, either drop the scenario or phrase it as a discovery scenario:
"Find out whether X can be done for Y" with expected results that accept both outcomes.
