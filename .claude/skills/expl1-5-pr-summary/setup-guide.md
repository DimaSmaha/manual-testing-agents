# Setup guide for the PR Summary skill

This skill reads a PR and produces a summary of the changes for the code review skill.
The logic for describing files and verification is universal. Only the
way of accessing the PR needs to be configured.

## What you need to know before setup

### 1. Which version control system do you use?

GitHub, GitLab, Bitbucket, Azure DevOps, or another one.

### 2. How will the AI access the PR?

Options:
- **CLI** (recommended) — `gh` for GitHub, `glab` for GitLab.
  Make sure the CLI is installed and authorized.
- **REST API** — direct calls to the platform API.
  An access token is required.

### 3. What is the PR URL format in your system?

Examples:
- GitHub: `https://github.com/owner/repo/pull/123`
- GitLab: `https://gitlab.com/owner/repo/-/merge_requests/123`
- Bitbucket: `https://bitbucket.org/owner/repo/pull-requests/123`

## Setup order

### Step 1: SKILL.md — "Input" section

Replace the `⚠️ CONFIGURE` block with the PR URL format of your system.

### Step 2: SKILL.md — "Code access" section

Replace the `⚠️ CONFIGURE` block with the concrete tools
and commands for your system. Specify:
- Which CLI or API to use
- What to do if the CLI is unavailable

### Step 3: SKILL.md — "Workflow" section

Replace the `⚠️ CONFIGURE` block and the GitHub command example
with the real commands for your system:
- PR mode (PR URL provided)
- Branch mode (branch name only)
- How to read the diff and the full file content

### Step 4: SKILL.md — "If the CLI is unavailable" section

Replace the `⚠️ CONFIGURE` block with the concrete authorization
command for your CLI.

## Check after setup

- [ ] All `⚠️ CONFIGURE` blocks in SKILL.md are replaced
- [ ] Concrete CLI commands or API requests are specified
- [ ] The authorization command is specified
- [ ] What to do if the CLI is unavailable is described

## Skill files

```
expl1-5-pr-summary/
  SKILL.md                         — skill instructions
  references/
    output-template.md             — output file template
  setup-guide.md                   — this guide
```
