# Report

Used by [../SKILL.md](../SKILL.md) step 6. Covers the finding format every file uses, the full report template, the chat summary and diff mode.

## 1. Finding format (LOCKED)

Auditors, the judge and the report all use this format. Do not change field names or their order.

```
### F<n>: <short title>
- Auditor: <auditor name> | Dimension: <dimension>
- Severity: critical | major | minor | nit
- Confidence: high | medium | low
- Kind: bug | taste
- Evidence: `<path>:<line>` "<verbatim quote>"
- Fix: <concrete change; a unified diff when possible>
```

Severity:

- **critical**: the skill fails or causes harm in normal use.
- **major**: fails on common inputs, or misleads.
- **minor**: works, but degraded.
- **nit**: polish.

Confidence meanings are in [judge.md](judge.md) section 5.

Kind:

- **bug**: a concrete input or step where the skill fails, misleads or causes harm.
- **taste**: wording, style, or a better way the skill does not need.

## 2. Dimension names

Each auditor's persona file sets its dimension. Use these names verbatim in findings and verdicts.

| Auditor | Dimension |
|---|---|
| Trigger & Scope | Trigger & Scope |
| Cold-Start Executor | Cold-Start Executability |
| Domain Expert | Domain Correctness |
| Adversary | Robustness & Safety |
| Context Economist | Context Efficiency |
| Definition of Done | Definition of Done |
| Custom auditor | the dimension its persona block gives |

## 3. Full report template (prism-report.md)

Write this file in the current working directory. Fill every section. If a section is empty, write "none" in it.

~~~markdown
# prism report: <skill name>

- Target: <absolute path to the target skill>
- Date: <YYYY-MM-DD>
- Mode: full | degraded | lite
- Empirical runs: <N prompts, baseline yes/no> | skipped (<reason>)
- Structural check: <N ERROR, M WARN> | skipped (<reason>)
- Budget: about 15 tool calls per auditor; <overruns or skipped scope, or "none">

## Auditor roster

| Auditor | Axis | Status | Reason |
|---|---|---|---|
| Cold-Start Executor | horizontal | picked | always on |
| Adversary | vertical | skipped | no destructive operations, credentials, external reads or tool dependency |

## Verdicts

| Dimension | Verdict | Findings |
|---|---|---|
| Cold-Start Executability | pass | none |

Verdicts are pass, concern or fail. There are no scores.

## Top 3 fixes

1. F<n>: <title>. <one-line change>.
2. ...
3. ...

List only real fixes, highest impact first (fail-level bugs before concern-level bugs). If fewer than three real issues exist, list fewer. Do not pad.

## Findings

<bug findings in the LOCKED format, F1..Fn, sorted as in judge.md section 11>

## Fixes

### Fix for F<n>: <title>

```diff
<unified diff>
```

Status: not applied. Apply only when the user asks.

## Taste suggestions

<taste findings in the LOCKED format. No fix is required. Each is labeled taste.>

## Unverified

- <unverified claims, with what source would settle each one>

## Dropped in judge pass

- Hallucinated quotes: <n>
- Quote does not support the claim: <n>
- Duplicates merged: <n>
- Padding: <n>
- No concrete fix: <n>
~~~

## 4. Chat summary format

Reply with this, at most about 12 lines. Use the same verdict wording as the report.

```
prism: <skill name>, <mode> mode
Verdicts: Trigger & Scope <v> | Cold-Start Executability <v> | Domain Correctness <v> | ...
Top 3 fixes:
1. F<n>: <title>
2. F<n>: <title>
3. F<n>: <title>
Full report: <absolute path to prism-report.md>
Fixes are patches in the report and are not applied. Ask to apply them.
```

Rules:

- If there are no significant issues, replace the Top 3 block with "No significant issues found."
- In degraded or lite mode, add: "Auditors shared one context, so independence is weaker."
- In diff mode, replace the Top 3 block with the counts of fixed, regressed and new findings.

## 5. Diff mode (re-audit)

Use diff mode when `prism-report.md` from an earlier run exists and the user re-audits the target. Run the full procedure again, then compare with the earlier report. Match findings by Evidence path and by quote or title. If the quote changed, match by the fix target.

~~~markdown
# prism diff: <skill name>

- Previous report: <absolute path, date>
- Current report: <absolute path, date>

## Fixed
- F<n> (previous): <title>. No longer present.

## Regressed
- <title>: fixed in the previous report, present again. Evidence: `<path>:<line>` "<quote>"

## New
<locked-format findings that were not in the previous report>

## Still open
- <title>: present in both reports.
~~~

Before writing, rename the earlier file to `prism-report.prev.md` so it is not lost. Write the diff section into the new `prism-report.md` after the verdicts.
