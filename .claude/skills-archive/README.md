# Skills archive

Retired versions of skills. Nothing here is loaded by Claude Code (only `.claude/skills/` is).

| Folder | What it is | Replaced by |
|--------|------------|-------------|
| `expl1-8-web-testing-claude-desktop/` | **Claude Desktop skill version** of stage 8 (web testing) — drives the browser through the Claude in Chrome extension; login configured in `references/login-config.md`. | `.claude/skills/expl1-8-web-testing` (playwright-cli, headed browser, named session `qa-<ISSUEKEY>`, user helps with login) |

To restore an archived skill, copy its folder into `.claude/skills/` (rename it so the name does not clash with the active skill).
