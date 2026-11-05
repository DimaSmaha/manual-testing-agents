# Setup guide for the Web Testing skill

This skill executes the QA and FAIL test cases in a real browser.
The testing logic, classification, and navigation memory are universal.
Only the login configuration needs to be configured.

## What you need to know before setup

### 1. Which browser tool do you use?

The skill is built for the **Claude in Chrome extension**.
All tool names (`navigate`, `find`, `computer`, `form_input`,
etc.) are the names of this extension's tools.

If you use Playwright MCP or another tool —
you need to adapt all tool names in SKILL.md
and references/browser-rules.md to your system.

### 2. What does login look like in your product?

- The login page URL
- How to find the email/username and password fields (label, placeholder)
- The text of the submit button
- Which credentials to use and where to get them
- What appears after a successful login

### 3. Is registration of new users needed?

If the test cases require creating new accounts —
prepare an email template and default data for registration.

## Setup order

### Step 1: references/login-config.md — login (REQUIRED)

This is the only file that requires configuration.
Replace all `<placeholders>` with real values:

- The login URL
- Descriptions of the login form fields
- Credentials for each role
- The success indicator after login
- Actions after login (if any)

If registration is not needed — delete the Registration section
and the Default data section.

### Step 2: navigation_paths.json — navigation memory

The file is already present as an empty structure `{"navigation_paths": {}}`.
Nothing needs to be changed — the skill will fill it in itself
during the first run when it learns the paths to the pages.

### Step 3 (optional): SKILL.md — name of the previous skills

If your chain of skills is named differently from
`expl1-6-code-review` and `expl1-4-qa-test-cases` — update the references
to these skills in the "Input" section of SKILL.md.

## Check after setup

- [ ] references/login-config.md contains no `<placeholders>`
- [ ] The login URL is specified
- [ ] Credentials are specified for all roles
- [ ] The success indicator is specified
- [ ] The source of credentials is specified (hardcoded / .env / other)

## Skill files

```
expl1-8-web-testing/
  SKILL.md                         — skill instructions
  navigation_paths.json            — memory of navigation paths
  references/
    login-config.md                — login configuration (configure this!)
    browser-rules.md               — browser interaction rules
    output-template.md             — output file template
  setup-guide.md                   — this guide
```
