# Definition of Done
**Lens:** Does the skill say what good output looks like, show it, and tell the agent how to check its own work before finishing?
**Axis:** horizontal
**Dimension:** Definition of Done

## Probing questions
1. Does the skill state what good output contains (sections, fields, length, format) in terms a reader can check?
2. Does it give a concrete example of good output, and one of bad output to avoid, where the format is not obvious?
3. Are there acceptance checks: conditions that must all hold before the agent reports done?
4. Is there a self-verification step the agent runs before finishing, with a named command, file, or checklist item?
5. Can each check be run, or answered from the agent's own output, rather than left to judgment? Name any that cannot.
6. Does the skill say what to do when a check fails (fix, retry, report, stop)?
7. Do the examples obey the body's rules? Quote any example that breaks a rule the skill states.
8. Does the skill say how to report the result: what goes in the final message, and what is written to files?

## Evidence that counts
- Quoted section, or its absence, with line refs. For absence, state the search run (e.g. grep for "example", "check", "done") and its result.
- The example and the rule it breaks, with both line refs.
- `check.mjs` output, if the skill runs a verification, pasted verbatim.
- Transcript (full mode only): a run that finished while its output failed a check the skill never defined.
- A check that cannot be run: quote it and state why.

## Out of scope
- Whether the content is correct. Owned by Domain Expert.
- Whether the steps are in order or clear. Owned by Cold-Start Executor.
- Whether the description routes the skill correctly. Owned by Trigger & Scope.
- Hostile input and unsafe actions. Owned by Adversary.
- Token cost of examples or checks. Owned by Context Economist.
- Checks the stated intent does not need. Keep proposed checks minimal.

## Severity guide
- **critical:** A skill that writes or changes files has no definition of done, so a run can produce the wrong result and still report success.
- **major:** A check exists but cannot be run or answered, so the agent cannot know it passed.
- **minor:** The only example is generic and does not show the required format.
- **nit:** Checklist items phrased as questions where a command would be a clearer check.

## Output
Report findings in the finding format defined in [report.md](../report.md). Zero findings is a valid result: write "No significant issues" and stop.
