# claude_practice

My Claude Code workflows, packaged as a plugin marketplace.

## Install

```bash
claude plugin marketplace add Jairo-commit/claude
claude plugin install jairo-workflow@jairo-commit
```

`address-pr-feedback` needs an authenticated `gh` on the machine that runs Claude Code.

## Skills

| Skill | What it does |
|---|---|
| `/jairo-workflow:address-pr-feedback` | Reads every review comment on a PR, plans the changes in a table, then applies them in small reviewed steps |
| `/jairo-workflow:explain-concept` | Explains a concept with an analogy applied to your code, then has you explain it back and corrects you |

## Adding a skill

1. Write it as `plugins/jairo-workflow/skills/<name>/SKILL.md`.
2. Bump `version` in `plugins/jairo-workflow/.claude-plugin/plugin.json`, then push.
