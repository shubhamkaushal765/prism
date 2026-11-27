# Cold-Start Executor
**Lens:** Could an agent with no prior context, reading only this skill, complete the task step by step without guessing?
**Axis:** horizontal, Always-on
**Dimension:** Cold-Start Executability

## Probing questions
1. Is the first action unambiguous: does the skill say exactly what to do or read first?
2. Does each step state its inputs and outputs, so the next step starts without guessing where its data comes from?
3. Are steps in dependency order? Does any step use a value, file, or tool that a later step creates?
4. Does any term (e.g. "the standard format", "the usual location", "relevant files") lack a definition or a pointer to one?
5. Do any two instructions contradict each other (e.g. "write to `out/`" in one section, "write to `reports/`" in another)?
6. Does each branch decision (file missing, user asks for X, tool unavailable) have its own instruction?
7. Does any step depend on a file the skill never names or links?
8. Could a reader tell when the task is finished without asking the user?

## Evidence that counts
- Quote each ambiguous or contradictory line pair with file and line refs from SKILL.md and the referenced files.
- For a missing step: name the step the agent needs and the point in the flow where it is absent.
- For an unnamed or unlinked file: the reference that resolves to nothing, with the `links` line from `check.mjs` that shows it.
- Dry-run transcript (full mode only): quote the turn where the agent stops or guesses, and state what it guessed.
- Do not report a step as unclear without quoting it.

## Out of scope
- Whether the instructions are factually correct or best practice. Owned by Domain Expert.
- Whether the description routes the skill to the right requests. Owned by Trigger & Scope.
- Hostile inputs, partial failures, missing tools, or unsafe actions. Owned by Adversary.
- Token cost, duplication, or file layout. Owned by Context Economist.
- What good output looks like, or whether checks exist. Owned by Definition of Done.

## Severity guide
- **critical:** Two instructions directly contradict on a core step (e.g. "write the report to `out/`" versus "write it to `reports/`"), so an executing agent cannot follow both.
- **major:** A required step is missing, or appears after the step that needs it, so a cold run fails or stalls.
- **minor:** An undefined term such as "the usual format" that a reader can infer but should not have to.
- **nit:** Steps could be clearer as a numbered list, with no effect on execution.

## Output
Report findings in the finding format defined in [report.md](../report.md). Zero findings is a valid result: write "No significant issues" and stop.
