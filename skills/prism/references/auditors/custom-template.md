# Custom Auditor Template

Use this template to define a skill-specific auditor (spec section 6). Write the finished auditor in the same section layout as the default persona files: Lens, Axis, Dimension, Probing questions, Evidence that counts, Out of scope, Severity guide, Output.

## When to create one
- Create one only when the target is high-risk or in a specialized domain that none of the 6 default auditors covers (e.g. clinical, legal, financial, security-critical operations).
- A custom auditor counts toward the maximum of 8 auditors per audit, including the 2 always-on auditors.
- Prefer a default auditor when one fits. Do not create a custom auditor to repeat a default lens.
- Name it by role, not by skill: "Compliance Reviewer", not "Acme Skill Auditor".

## Fill-in block

```
# <Role name>
**Lens:** <one line: the single question this auditor answers>
**Axis:** vertical | horizontal
**Dimension:** <name used in the report verdict table>

## Probing questions
1. <concrete, checkable question>
...                         (5-10 total, numbered)

## Evidence that counts
- <proof type: quote with line ref, check.mjs line, empirical transcript, cited source>

## Out of scope
- <what this lens must NOT report, and which auditor owns it>

## Severity guide
- **critical:** <lens-specific example>
- **major:** <lens-specific example>
- **minor:** <lens-specific example>
- **nit:** <lens-specific example>

## Output
Report findings in the finding format defined in [report.md](../report.md). Zero findings is a valid result: write "No significant issues" and stop.
```

Field notes:
1. **Lens:** one line, one question.
2. **Axis:** tag as vertical (depth in one domain) or horizontal (breadth across the skill).
3. **Probing questions:** 5-10, each answerable from the target's files or a run.
4. **Evidence that counts:** the proof types this lens accepts.
5. **Out of scope:** the most important field. List every concern owned by another auditor, with its owner's name. This keeps lenses disjoint: each concern has exactly one owner.

## Example: Clinical Safety Reviewer

```
# Clinical Safety Reviewer
**Lens:** Could a reader act on this skill's medical guidance in a way that causes patient harm?
**Axis:** vertical
**Dimension:** Clinical Safety

## Probing questions
1. Does the skill tell the agent to give a diagnosis, dose, or treatment decision, rather than general information and a referral path?
2. Does it state dosing units, age or weight adjustments, and maximum limits wherever it gives a dose?
3. Does it name red-flag symptoms that require urgent care, and tell the agent to surface them first?
4. Are drug interactions and contraindications checked, or does the skill ignore them?
5. Does it say when to refuse or defer (e.g. emergencies, pregnancy, pediatric cases) and what to say instead?
6. Are the clinical sources cited current, and do they support the advice they are attached to?
7. Does the skill tell the agent to store or repeat patient identifiers beyond what the task needs?

## Evidence that counts
- Quoted dosing or triage line with file and line ref, plus the missing safeguard it lacks.
- A cited clinical guideline URL, retrieved in this run, with the date you read it.
- "unverified" for any clinical claim you could not check. Never call it wrong without a source.
- Transcript (full mode) where the agent gives a dose or diagnosis without a red-flag check.

## Out of scope
- Factual accuracy of general (non-clinical) content. Owned by Domain Expert.
- Clarity of the triage steps for a cold agent. Owned by Cold-Start Executor.
- Whether the skill triggers on medical requests. Owned by Trigger & Scope.
- Prompt injection through files the skill reads. Owned by Adversary.
- Token cost of the guidance. Owned by Context Economist.

## Severity guide
- **critical:** A dose or treatment instruction with no units or limits, or no red-flag referral, for a condition where delay causes harm.
- **major:** A contraindication check is missing for a common drug class the skill recommends.
- **minor:** A cited guideline is an older edition, with the current one available.
- **nit:** Medical term used loosely where a clinician would use the standard term.

## Output
Report findings in the finding format defined in [report.md](../report.md). Zero findings is a valid result: write "No significant issues" and stop.
```
