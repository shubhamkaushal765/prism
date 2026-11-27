<p align="center"><img src="assets/wordmark.svg" alt="prism" height="96"></p>

<p align="center"><em>Every skill, seen from every side.</em></p>

prism is an agent skill that reviews your other agent skills before your users run into their problems. It checks whether a skill will trigger at the right time, whether an agent can follow it, whether its facts hold up, and whether it is safe to run.

You get a short verdict in chat and a full report with ready-to-apply fixes.

## Quick start

In Claude Code, install prism as a plugin:

```
/plugin marketplace add shubhamkaushal765/prism
/plugin install prism@prism
```

In any other agent that supports skills:

```
npx skills add shubhamkaushal765/prism
```

Then ask your agent to audit a skill:

```
audit the skill at ./skills/my-skill
```

In Claude Code you can also type the command directly (`/prism:prism` when installed as a plugin, `/prism` when installed with `npx skills`):

```
/prism:prism ./skills/my-skill
```

## What you get back

A typical run ends with a summary like this:

```
prism: workspace-cleanup
Verdicts: Cold-Start Executability fail | Robustness & Safety fail | Domain Correctness pass | Context Efficiency pass
Top 3 fixes:
1. F1: Skill tells the agent to follow instructions from a remote README
2. F2: Script writes SYNC_API_TOKEN into cleanup.log
3. F3: Step 5 links to a guide that does not exist
Full report: ./prism-report.md
Fixes are patches in the report and are not applied. Ask to apply them.
```

- Every finding quotes the exact line it is about, so you can jump straight to it.
- Real bugs are kept separate from style opinions.
- Fixes come as patches in the report. Nothing in your skill changes unless you ask.
- "No significant issues" is a real answer. prism does not invent problems to look busy.

The verdicts mean:

- **pass**: no real problems found in this area.
- **concern**: a real problem, but the skill still works.
- **fail**: a problem that will likely break the skill or cause harm.
- **not run**: this area was not checked for this skill.

## What it checks

| Reviewer | The question it asks |
|---|---|
| Trigger & Scope | Will it activate when it should, and stay quiet when it should not? |
| Cold-Start Executor | Could an agent with no context follow it step by step? |
| Domain Expert | Is it correct and current? Facts that can go stale are checked against sources. |
| Adversary | What happens with odd input, missing tools, injected instructions, or destructive commands? |
| Context Economist | Is it lean, or does it waste the agent's context? |
| Definition of Done | Does it say what good output looks like, and how to check it? |

prism picks 4 to 8 of these based on what your skill does, and tells you why it picked or skipped each one. For a high-risk domain, it can add a specialist reviewer built for that field.

## How thorough is it?

- A small skill (one short SKILL.md with no other files) gets a quick single read-through.
- If your agent can run subagents, each reviewer works on its own, so no reviewer is swayed by another's findings. Otherwise the reviewers share one context, and the summary says so.
- When a sandbox is available, prism can try your skill on test prompts. It asks before running anything destructive.

The chat summary names the mode that ran.

## Install options

The two commands in Quick start cover most setups. prism also ships its own installer:

```
npx shubhamkaushal765/prism install
```

Commands:

- `install`: copy prism into each agent's skills folder.
- `uninstall`: remove prism from those folders.
- `update`: replace the installed copy with this version.
- `doctor`: report for each target whether prism is `up to date`, `outdated`, or `not installed`.

Flags:

- `--project` (default): install into the current project.
- `--global`: install into your home directory, for all projects. Cannot be combined with `--project`.
- `--agent <id>`: target one agent: `claude-code`, `codex`, `cursor`, or `opencode`. Repeat the flag for more than one.

Without `--agent`, prism looks for agents under your home directory and installs into each one it finds. If it finds none, it uses `claude-code`.

<details>
<summary>Where files go</summary>

| Agent id | Project directory | Global directory |
|---|---|---|
| `claude-code` | `.claude/skills` | `.claude/skills` |
| `codex` | `.agents/skills` | `.agents/skills` |
| `cursor` | `.agents/skills` | `.cursor/skills` |
| `opencode` | `.agents/skills` | `.config/opencode/skills` |

Project directories are relative to the current project. Global directories are relative to your home directory.

</details>

## Meet Facet

<p align="center"><img src="assets/facet.svg" alt="Facet, the prism mascot" height="120"></p>

Facet is a gem with a face and a jeweler's loupe: an inspector who looks closely. It reads every line twice, quotes what it finds, and is happiest when it finds nothing wrong.

## Contributing

Maintainers: see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
