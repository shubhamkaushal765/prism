# Selection

Used by [../SKILL.md](../SKILL.md) steps 1 and 2. Fill the profile first, then select.

## 1. Profile block

Fill every field. Write "unknown" instead of guessing. An unknown field is a reason to lean toward more auditors, not fewer.

```
Profile
- Type: procedural workflow | knowledge/reference | tool or API wrapper | generative/creative | orchestration of other skills
- Depth: single SKILL.md (<n> lines) | bundle (scripts: <n>, references: <n>, assets: <n>)
- Domain: <one phrase>
- Risk: low | medium | high
  - Why: <one line, naming the example that set the level>
- Assumptions: tools <list>; harness <list>; model <class>; network <yes | no | unknown>
- Stated intent: <the skill's own words about its purpose, or "none stated">
- Risk flags: <zero or more, from section 3>
- Mode: full | degraded | lite
```

Risk levels:

- **low**: writes or formats text, gives advice, no side effects. Example: a skill that drafts commit messages and runs no git commands.
- **medium**: edits files or transforms data in ways a reviewer can check. Example: a skill that refactors a module.
- **high**: finance, legal, medical, tax, destructive operations (delete, overwrite, deploy, send, pay), or credentials. Example: a skill that deletes rows in a production database.

## 2. Selection algorithm

1. Always include Cold-Start Executor and Domain Expert. They are the base of every roster.
2. For each signal in the profile, find its auditor in section 3. Add the auditor once, even if several signals point to it. Record the signal as the reason.
3. For each risk flag, add the auditor mapped to it (once per auditor).
4. Check the axis mix. The roster needs at least one vertical auditor (Domain Expert, Adversary, or a vertical custom auditor) and at least one horizontal auditor (Trigger & Scope, Cold-Start Executor, Context Economist, Definition of Done). The always-on pair normally covers both. If not, add the closest missing one.
5. If the roster has fewer than 4 auditors, add default auditors in this order until it has 4: Trigger & Scope, Context Economist, Definition of Done, Adversary. Reason: "general coverage, minimum 4".
6. Going beyond 4 is allowed only when the profile names a signal for each extra auditor. Write that signal in the reason.
7. Add a custom auditor only when all three hold: (a) risk is high, (b) the domain has checkable rules that the Domain Expert cannot cover from general knowledge (for example this year's tax thresholds or a dosing table), and (c) no default auditor covers those rules. Build it from [auditors/custom-template.md](auditors/custom-template.md). It counts toward the cap. Write its persona file to a scratch directory outside the target, never into the target.
8. Cap at 8. If the signals need more slots, keep the ones tied to the highest risk. Record the rest as skipped with "cap reached".
9. If unsure, pick from the six default auditors only. Do not create a custom one.
10. Record every obvious candidate that was not picked, with its reason. Examples: "no signal: no external reads", "overlaps with Cold-Start Executor", "cap reached", "single 40-line file, no bundle".

## 3. Signal-to-auditor table

Risk flags are the rows marked "risk flag". Each flag adds its auditor once.

| Profile signal | Auditor | Axis | Risk flag |
|---|---|---|---|
| Destructive or irreversible actions (delete, overwrite, deploy, send, pay) | Adversary | vertical | yes |
| Credentials or secrets handled | Adversary | vertical | yes |
| Reads external files, web pages or user documents (prompt-injection surface) | Adversary | vertical | yes |
| Runs shell commands, or depends on tools that may be missing | Adversary | vertical | yes |
| Specialized high-risk domain (finance, legal, medical, tax, compliance) | Domain Expert (always on), plus a custom auditor per rule 7 | vertical | yes |
| Bundle with scripts, references or assets, or SKILL.md over ~200 lines | Context Economist | horizontal | no |
| Generative or creative output, or no examples, checks or self-verification step | Definition of Done | horizontal | no |
| Vague or broad description, or no trigger phrases and no "when not to use" | Trigger & Scope | horizontal | no |
| Time-sensitive claims (versions, APIs, prices, regulations) | Domain Expert (always on) verifies with web search | vertical | no |

## 4. Custom auditor

The custom persona needs:

- a one-line lens,
- a vertical or horizontal tag,
- 5-10 probing questions,
- the evidence that counts,
- an explicit out-of-scope list that names the neighboring default auditors.

The out-of-scope list keeps lenses disjoint. Give the custom auditor a dimension name (the judge uses it for the verdict table).

## 5. Worked examples

### Example A: commit-message helper (4 picked)

- Profile: type generative; depth single SKILL.md (40 lines); domain git commit text; risk low ("writes text only"); assumptions none; stated intent "write Conventional Commits messages"; risk flags none. Signals: description is "Helps with commits" (vague); no examples.
- Picked:
  - Cold-Start Executor: always on.
  - Domain Expert: always on; checks the Conventional Commits claims.
  - Definition of Done: generative output, no examples.
  - Trigger & Scope: vague description.
- Skipped:
  - Adversary: no destructive operations, credentials, external reads or tool dependency. The skill only writes text.
  - Context Economist: single 40-line file, no bundle.
- Result: 4 auditors, the minimum. No extras.

### Example B: database cleanup skill (4 picked)

- Profile: type procedural workflow; depth bundle (scripts: 2, references: 1), SKILL.md 260 lines; domain PostgreSQL maintenance; risk high ("deletes rows"); assumptions: psql on PATH, DB credentials in environment, network unknown; stated intent "remove sessions older than 30 days". Risk flags: destructive operations, credentials, external reads (user-supplied SQL files), tool dependency.
- Picked:
  - Cold-Start Executor: always on.
  - Domain Expert: always on; checks SQL and PostgreSQL claims.
  - Adversary: four risk flags map to it, so it gets one slot.
  - Context Economist: bundle and a 260-line SKILL.md.
- Skipped:
  - Trigger & Scope: the description names the trigger ("clean stale sessions") and the exclusion ("not for schema changes"). No signal.
  - Definition of Done: the skill has a dry-run step and a row-count check. Covered by the skill itself.
  - Custom auditor: no checkable domain rules beyond PostgreSQL basics, which the Domain Expert covers.
- Result: 4 auditors, the minimum.

### Example C: tax-draft skill (5 picked)

- Profile: type procedural workflow; depth bundle (references: 6, scripts: 1), SKILL.md 180 lines; domain personal income tax; risk high; assumptions: reads uploaded PDFs, fetches current tax tables, network yes; stated intent "prepare a draft return for review, never file". Risk flags: external reads (user PDFs), high-risk domain.
- Picked:
  - Cold-Start Executor: always on.
  - Domain Expert: always on; checks general correctness and verifies time-sensitive claims.
  - Adversary: reads user PDFs (prompt injection can hide in documents).
  - Context Economist: bundle of six references.
  - Tax Rules Checker (custom, vertical): checks every numeric rule and threshold against the stated tax year and its cited source. Rule 7 applies: high risk, checkable year-specific rules, no default covers them.
- Skipped:
  - Trigger & Scope: the description is specific ("draft a US return from uploaded W-2 PDFs"). No signal.
  - Definition of Done: the skill has a reconciliation checklist.
- Result: 5 auditors. The fifth slot is the custom auditor, justified by rule 7 (high risk, checkable year-specific rules, no default covers them). Context Economist is the fourth pick, justified by the bundle signal. The custom auditor owns numeric rules, and the Domain Expert keeps everything else.
