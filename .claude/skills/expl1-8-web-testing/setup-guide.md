# Setup guide for the Web Testing skill

This skill executes the QA and FAIL test cases in a real, visible (headed) browser
through `playwright-cli`. The testing logic, classification, and navigation memory are
universal. Almost nothing needs to be configured: the user logs in themselves and the
agent asks for help when it needs it.

## What you need before the first run

1. `playwright-cli` available:
   - check `npx --no-install playwright --version`, or `playwright-cli --help`;
   - otherwise `npm install -g @playwright/cli@latest` (the agent asks before installing).
2. The app is running and reachable (the agent asks for the URL if it is not known).
3. You are ready to log in manually in the browser window the agent opens
   (the login is kept in a persistent profile, so later runs usually skip it).

## How it works

- Session tag: `qa-<ISSUEKEY>` (for example `qa-TASK-114`). Every command uses
  `playwright-cli -s=<SESSION> ...`.
- The browser is opened headed with a persistent profile:
  `playwright-cli -s=qa-TASK-114 open <URL> --headed --persistent`.
- When the agent is blocked (login, captcha, missing data, element not found, unclear step)
  it stops and asks you. You act in the open window, say "done", and it continues.
- Screenshots (FAIL evidence only) and run scripts go to
  `.workflow-artifacts/<ISSUEKEY>/web-testing/`. The report goes to
  `.workflow-artifacts/<ISSUEKEY>/<ISSUEKEY>-web-testing.md`.
- `playwright-cli` snapshots are written to `.playwright-cli/` (excluded in
  `.git/info/exclude`).

## Optional configuration

- `references/login-config.md` — optional app settings (base URL, notes). Empty is fine.
- `navigation_paths.json` — navigation memory. Already present as an empty structure;
  the skill fills it in during the first run.
- If your chain of skills is named differently from `expl1-6-code-review` and
  `expl1-4-qa-test-cases`, update the references in the "Input" section of SKILL.md.

## Skill files

```
expl1-8-web-testing/
  SKILL.md                         — skill instructions
  navigation_paths.json            — memory of navigation paths
  references/
    login-config.md                — optional app settings (login is manual)
    browser-rules.md               — playwright-cli interaction rules
    output-template.md             — output file template
  setup-guide.md                   — this guide
```
