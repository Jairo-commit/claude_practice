# claude_practice

My Claude Code workflows, packaged as a plugin marketplace.

## Install

```bash
claude plugin marketplace add Jairo-commit/claude
claude plugin install jairo-workflow@jairo-commit
```

Inside a Claude Code session, the same commands work as `/plugin marketplace add …` and
`/plugin install …`.

`address-pr-feedback` needs an authenticated `gh` on the machine that runs Claude Code.

## jairo-workflow

| Skill | What it does |
|---|---|
| `/jairo-workflow:address-pr-feedback` | Reads every review comment on a PR, plans the changes in a table, then applies them in small reviewed steps |
| `/jairo-workflow:explain-concept` | Explains a concept with an analogy applied to your code, then has you explain it back and corrects you |

Each workflow is a skill: its instructions live in
[`plugins/jairo-workflow/skills/<name>/SKILL.md`](plugins/jairo-workflow/skills/).

## Adding or changing a workflow

1. Write it as `plugins/jairo-workflow/skills/<name>/SKILL.md`, with a `name` and a `description`
   that says when to use it.
2. Bump `version` in `plugins/jairo-workflow/.claude-plugin/plugin.json`, then push. Users get the
   change with `/plugin marketplace update jairo-commit`.
