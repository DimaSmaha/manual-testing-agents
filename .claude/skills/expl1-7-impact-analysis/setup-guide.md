# Setup guide for the Impact Analysis skill

This skill compares the PR with the commit before it, builds an impact map and checks the
dependent files that the PR did not change. The analysis logic (rules, tiers, checks,
classification) is universal. Only the way of accessing the code needs to be configured.

## What you need to know before setup

### 1. Which version control system do you use?

GitHub, GitLab, Bitbucket, Azure DevOps, or another one. The skill is written for GitHub + `gh`.

### 2. How will the AI access the code?

- **CLI** (default) — `gh` for GitHub. Make sure it is installed and authorized (`gh auth login`).
- **Local git clone** (alternative, read-only) — see below.

### 3. What is the PR URL format?

GitHub: `https://github.com/owner/repo/pull/123`.

## Setup order

1. Install and authorize the CLI: `gh auth login`.
2. If you use another VCS — replace the commands in the "Code access" section of `SKILL.md`
   (PR metadata, merge base, file at a commit, file list at HEAD, diffs).

## Local clone variant (alternative to gh)

Use it only when the user explicitly allows it. The clone goes to a git-ignored folder
inside the repo, for example `.workflow-artifacts/clone/<repo>`. All commands are read-only.

```
git clone <repo URL> .workflow-artifacts/clone/<repo>
git -C .workflow-artifacts/clone/<repo> fetch origin pull/<N>/head:pr-<N>
git -C .workflow-artifacts/clone/<repo> merge-base main pr-<N>
git -C .workflow-artifacts/clone/<repo> diff --name-status main...pr-<N>
git -C .workflow-artifacts/clone/<repo> show <sha-or-pr-branch>:<path>
git -C .workflow-artifacts/clone/<repo> ls-tree -r --name-only pr-<N>
git -C .workflow-artifacts/clone/<repo> grep -n "<symbol>" pr-<N> -- <folder>
```

- BASE = the result of `merge-base`; HEAD = `pr-<N>`.
- Read only from BASE and HEAD, not from the checked-out `main` files.
- Delete the clone folder when the pipeline run is finished.

## Check after setup

- [ ] `gh auth status` succeeds (or the local clone variant is explicitly allowed)
- [ ] The merge-base command returns a commit SHA for a test PR
- [ ] The file-at-commit command returns the file content for both BASE and HEAD
- [ ] The repository file list at HEAD is returned

## Skill files

```
expl1-7-impact-analysis/
  SKILL.md                         — skill instructions
  references/
    output-template.md             — output file template
    configure-blocks-original.md   — archive of the original placeholder CONFIGURE blocks (not loaded in a run)
  setup-guide.md                   — this guide
```
