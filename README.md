<p align="center"><img src="assets/wordmark.svg" alt="prism" height="96"></p>

<p align="center"><em>Every skill, seen from every side.</em></p>

prism: an agent skill that audits other skills. Profiles the skill, picks 4–8 auditors for depth and breadth, verifies the findings, and returns a report with fixes.

## How it works

prism runs a fixed pipeline:

0. Mode selection, in this order: lite if the skill is a single SKILL.md under about 100 lines with no other files (one read-through); otherwise full if the agent has a subagent tool and a shell; otherwise degraded (single read-through, no empirical runs).
1. Profiling: type, depth, domain, risk, assumptions, and stated intent.
2. Auditor selection: 4 to 8 auditors, with a reason for each pick and each skip.
3. Empirical runs (full mode, optional): 3 to 5 generated test prompts, transcripts captured.
4. Independent audits: each auditor works in isolation and cites evidence for every finding.
5. Judge pass: verifies findings, merges duplicates, resolves conflicts, separates bugs from taste.
6. Report and fixes: a verdict per dimension, top 3 fixes, full findings, and patches.

The six default auditors:

| Auditor | Axis | Core question |
|---|---|---|
| Trigger & Scope | Horizontal | Does it fire when it should, and stay quiet when it should not? |
| Cold-Start Executor | Horizontal, always on | Could an agent with no context follow it step by step? |
| Domain Expert | Vertical, always on | Is the content correct and current, and what would a senior practitioner wince at? |
| Adversary | Vertical | What breaks on odd inputs, partial failures, or unsafe actions? |
| Context Economist | Horizontal | Is it token-efficient, free of duplication, and free of dead files? |
| Definition of Done | Horizontal | Does it say what good output looks like and how to verify it? |

The two always-on auditors are Cold-Start Executor and Domain Expert. prism picks 4 to 8 auditors in total, with at least one vertical and one horizontal.

Verdicts, one per dimension:

- **pass**: no verified bugs, or only nits and taste.
- **concern**: any other verified bug of severity minor or above, including a major bug with medium or low confidence.
- **fail**: a verified critical bug, or a verified major bug with high confidence.
- **not run**: the dimension's auditor was not picked for this skill.

## Meet Facet

<p align="center"><img src="assets/facet.svg" alt="Facet, the prism mascot" height="120"></p>

Facet is a gem with a face and a jeweler's loupe: an inspector who looks closely. It reads every line twice, quotes what it finds, and is happiest when it finds nothing wrong. See [docs/brand.md](docs/brand.md) for the brand guide.

## Install

Claude Code, as a plugin:

```
/plugin marketplace add shubhamkaushal765/prism
/plugin install prism@prism
```

Any supported agent, with the skills CLI:

```
npx skills add shubhamkaushal765/prism
```

Installer built into prism:

```
npx shubhamkaushal765/prism install [--global] [--agent <id>]
```

Global npm package:

```
npm i -g @shubhamkaushal765/prism
prism install
```

## CLI reference

```
prism <command> [--global | --project] [--agent <id>]...
```

Commands:

| Command | What it does |
|---|---|
| `install` | Copies the prism skill into each agent's skills directory. |
| `uninstall` | Removes prism from each agent's skills directory. |
| `update` | Same as `install`; replaces the installed copy. |
| `doctor` | Prints one line per target: `up to date`, `outdated`, or `not installed`. |

Flags:

- `--project` (default): install under the current directory.
- `--global`: install under your home directory. Cannot be combined with `--project`.
- `--agent <id>`: target one agent. Repeat the flag for more agents.

Agent ids and their directories (relative to the project or home base):

| Agent id | Project directory | Global directory |
|---|---|---|
| `claude-code` | `.claude/skills` | `.claude/skills` |
| `codex` | `.agents/skills` | `.agents/skills` |
| `cursor` | `.agents/skills` | `.cursor/skills` |
| `opencode` | `.agents/skills` | `.config/opencode/skills` |

Without `--agent`, prism detects agents by their marker directories under your home directory (`~/.claude`, `~/.codex`, `~/.cursor`, `~/.config/opencode`). If none is found, it uses `claude-code`.

## Usage

Ask the agent to audit a skill:

```
/prism path/to/skill
audit the skill at ./skills/invoice-helper
```

prism writes two outputs:

- A summary in the chat.
- The full report in `prism-report.md`.

Fixes are patches. prism does not apply them unless you ask.

## Development

```
npm test          # node --test
npm run check     # static check of the prism skill, then version sync
```

- `evals/` holds a calibration set of skills with planted flaws. See [evals/README.md](evals/README.md).
- Eval skills live at `evals/<case>/<skill-name>/`, for example `evals/clean/csv-column-summary`. To run one, ask an agent to "audit the skill at evals/<case>/<skill-name>", then compare the resulting `prism-report.md` with `evals/<case>/expected.md`, where the case has one.
- Version sync: `version` in `package.json`, `.claude-plugin/plugin.json`, and `.claude-plugin/marketplace.json` must match. `npm run check` enforces this.
- Release: bump the three versions, then push a tag `vX.Y.Z`. The release workflow checks the tag against `package.json`, then publishes to npm with provenance.

## License

MIT
