# claude_practice

My Claude Code workflows, packaged as a plugin marketplace. A personal project to learn how
Claude Code plugins work.

## Install

```bash
claude plugin marketplace add Jairo-commit/claude
claude plugin install jairo-workflow@jairo-commit
```

Restart Claude Code afterwards, or run `/reload-plugins` in an open session. Inside a session,
the same commands also work as `/plugin marketplace add …` and `/plugin install …`.

`address-pr-feedback` needs an authenticated `gh` (`gh auth login`) on the machine that runs
Claude Code.

### Update

```bash
claude plugin marketplace update jairo-commit
claude plugin update jairo-workflow@jairo-commit
```

### Check the install

```bash
claude plugin list                                   # jairo-workflow@jairo-commit, enabled
claude plugin details jairo-workflow@jairo-commit    # lists the skills below
```

## Skills

| Skill | What it does |
|---|---|
| `/jairo-workflow:address-pr-feedback` | Reads every review comment on a PR, plans the changes in a table, then applies them in small reviewed steps |
| `/jairo-workflow:explain-concept` | Explains a concept with an analogy applied to your code, then has you explain it back and corrects you |

Run a skill with its slash command, or just ask for it: Claude picks a skill when the request
matches its description.

```
/jairo-workflow:address-pr-feedback 123
/jairo-workflow:explain-concept why does this migration use RunSQL?
"Address the review comments on my PR"
"Explain to me how Django migration state works"
```

## Repository layout

```
.claude-plugin/marketplace.json            the marketplace: its name (jairo-commit) and its plugins
plugins/jairo-workflow/
├── .claude-plugin/plugin.json             the plugin: name, version, description
└── skills/
    ├── address-pr-feedback/SKILL.md
    └── explain-concept/SKILL.md
```

Each skill is one `SKILL.md`: a header with its `name` and a `description` that says when to use
it, then the instructions Claude follows.

## Adding or changing a skill

1. Write it as `plugins/jairo-workflow/skills/<name>/SKILL.md`.
2. Check it: `claude plugin validate .`
3. Try it locally before pushing: `claude --plugin-dir ./plugins/jairo-workflow`
4. Bump `version` in `plugins/jairo-workflow/.claude-plugin/plugin.json`, then push. Without a new
   version, `claude plugin update` does not pick up the change.

## Docs

- [Creating a plugin](https://code.claude.com/docs/en/plugins/create.md)
- [plugin.json reference](https://code.claude.com/docs/en/plugins/manifest-reference.md)
- [Creating a marketplace](https://code.claude.com/docs/en/plugins/create-marketplace.md)
