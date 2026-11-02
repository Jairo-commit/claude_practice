# claude_practice

My Claude Code workflows, packaged as a plugin marketplace.

## Install

```
/plugin marketplace add Jairo-commit/claude_practice
/plugin install jairo-workflow@jairo-commit
```

Needs `node` 20+ and an authenticated `gh` on the machine that runs Claude Code.

## jairo-workflow

| Piece | What it does |
|---|---|
| `/jairo-workflow:address-pr-feedback` | Skill that runs the PR feedback workflow |
| `pr-feedback` MCP server | Tools `get_pr_feedback`, `get_pr_changed_files`, `get_workflow` and the prompt `address-pr-feedback` |

The workflow text lives in
[`plugins/jairo-workflow/mcp/pr-feedback/workflows/`](plugins/jairo-workflow/mcp/pr-feedback/workflows/).

## Changing the MCP server

`dist/server.js` is committed so the plugin works without an install step. Rebuild it after any
change to `src/` or `workflows/`:

```bash
cd plugins/jairo-workflow/mcp/pr-feedback
npm install
npm run typecheck && npm test && npm run build
```

## Adding a workflow

1. Write it as `plugins/jairo-workflow/mcp/pr-feedback/workflows/<name>.md`, or as a new skill in
   `plugins/jairo-workflow/skills/<name>/SKILL.md` when it needs no tools.
2. Register a markdown workflow in `WORKFLOWS` in `src/server.ts` and rebuild.
3. Bump `version` in `plugins/jairo-workflow/.claude-plugin/plugin.json` so `/plugin update` picks it up.
