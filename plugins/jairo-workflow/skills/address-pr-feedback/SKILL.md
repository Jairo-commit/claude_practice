---
name: address-pr-feedback
description: Work through reviewers' comments on a pull request - read every comment, plan the changes in a table, then apply them in small reviewed steps. Use when asked to address, fix, handle or go through PR review feedback or review comments.
---

# Addressing PR review feedback

How to work through reviewers' comments on a pull request: read everything, plan the changes,
then apply them in small steps that you review one at a time.

Work on the pull request the user named, or on the pull request of the current branch when they
named none (`gh pr view --json number,url`).

## 1. Read every comment

Pull the review summaries and the inline comments, replies included:

```bash
gh pr view <number> --json title,url,state,reviewDecision,reviews,comments
gh api repos/{owner}/{repo}/pulls/<number>/comments --paginate \
  --jq '.[] | {id, user: .user.login, path, line, in_reply_to_id, body}'
```

- A review in the `CHANGES_REQUESTED` state is a blocker. Its body usually says why.
- Read the reply threads (`in_reply_to_id`): the reviewers often refine or merge ideas there.

## 2. Summarize, then list the changes

- Start with the main ideas, the few themes behind all the comments, and name the blocker first.
- Then a numbered list of concrete changes, each with the file and line it touches.
- Flag any suggestion that conflicts with a team convention instead of silently following
  the reviewer or the convention.

## 3. Build the table

One row per change:

| # | Change | Type | Comments that suggest it |
|---|---|---|---|

- **Comments are quoted word for word**, typos included, with the author and file:line.
  A comment can appear in more than one row.
- **Type**:
  - 🔴 **Blocker**: an explicit request for changes, a real bug, or an open question
    that must be answered before merging.
  - 🟡 **Suggestion**: tagged `suggestion:`, `thought:` or `question:`, or a design preference.
  - 🟢 **Minor fix**: a small cleanup, or a suggestion that a repo rule makes mandatory.
  - ⚪ **Stale**: a comment with nothing left to do, because addressing another comment changes
    or removes the code it is about.
- Say which types are the reviewers' own and which are your classification.
- **A stale comment still gets a row.** In the Change column, write "Stale: addressing" and
  quote the comment that makes it stale, word for word, with its author and file:line, plus
  the number of the row that addresses it. Never drop a stale comment silently: the reviewer
  should see why it needs no change.

  | # | Change | Type | Comments that suggest it |
  |---|---|---|---|
  | 8 | None. Stale: addressing "Let's group these helpers into a package…" (reviewer, `helpers/note_helpers.py:1`, row 5) moves this module into a package | ⚪ Stale | reviewer, `helpers/note_helpers.py:9`: "I like these small atomic modules." |

## 4. Apply in small steps

- **One change, or one group of closely related changes, at a time.** Stop after each
  step so the work can be reviewed before moving on.
- **Before editing, find every caller** of the code being changed. A fix that breaks another
  caller (an importer, a signal handler, another module) is worse than no fix.
- **Stay inside the PR.** `gh pr diff <number> --name-only` lists the files in the diff. When a
  change needs a file outside it, ask first. If the answer is "not now", keep a note to leave
  a PR comment explaining why that change is needed.
- **Ask when a decision is really yours to make**, such as scope or a conflict between a
  reviewer and a convention. Give the options and a recommendation.
- **Don't commit, merge or rebase.** That stays manual.

## 5. Verify each step

- Run only the test files the change touches, plus lint and type checks on the changed files,
  using the commands the project documents (its `CLAUDE.md`, `README`, `Makefile` or
  `package.json` scripts). If it documents none, ask which commands to use. Never run the
  full suite unless asked.
- A new test must fail before the change and pass after it. Check by reverting only the
  source file, never the test.
- After renaming or deleting a symbol, field or error message, grep the whole repo,
  docs included, and update every reference.
- When a test fails, find out whether the change caused it before fixing anything.
  Compare with the code before the change.

## 6. Report each step

- **What changed**, file by file, with links.
- **Where you deviated from the reviewer's exact suggestion**, and why.
- **Behaviour changes** a user or another team would notice, such as a new error message
  or a changed export column.
- **Problems found outside the PR**: report them, don't fix them.
- **What's left** on the list.
- Verification results stated plainly: what passed, what failed, what wasn't run.

## 7. Explaining decisions

When asked "why?", answer directly and say so when an earlier claim was overstated.
Keep the real reason apart from the nice-to-have one.
