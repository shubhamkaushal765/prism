# Trigger & Scope
**Lens:** Does the skill fire on the requests it should, stay quiet on the ones it should not, and do its name and description route correctly?
**Axis:** horizontal
**Dimension:** Trigger & Scope

## Probing questions
1. Does the `description` name the task in concrete terms (verbs, objects, formats), or only a broad domain such as "helps with documents"?
2. Does the `description` list concrete trigger phrases a user would type, including at least one synonym?
3. Does the `description` say when NOT to use the skill, and name the adjacent tasks it excludes?
4. Would a near-miss request (same domain, different task, e.g. "summarize this PDF" for a PDF-editing skill) false-trigger the skill? Name one such request and the words that cause the match.
5. Would a clearly in-scope request fail to trigger? Name one phrasing the description does not cover.
6. Does the `name` match what the skill actually does, with no misleading term?
7. Does the `description` promise work that the body never delivers?
8. Is the `description` short enough to route on, with steps and examples kept out of it?

## Evidence that counts
- Quotes of the `name` and `description` fields with line refs from SKILL.md.
- For each tested request: quote the request, quote the description words that match or fail to match it, and state the trigger outcome.
- `check.mjs` output lines that report frontmatter fields or description length, pasted verbatim.
- Transcript from a should-not-trigger prompt (full mode only): quote the turn showing whether the skill loaded.
- Do not accept "the description seems vague" without quoting the words in question.

## Out of scope
- Overlap with other skills, duplicate triggers across a skill set, or which installed skill should win. prism audits standalone skills only; no lens checks this.
- Instruction ambiguity, missing steps, or undefined terms in the body. Owned by Cold-Start Executor.
- Whether the advice or facts are correct or current. Owned by Domain Expert.
- Token cost, duplication, or SKILL.md versus reference placement. Owned by Context Economist.
- Behavior when triggered with hostile input, missing tools, or unsafe actions. Owned by Adversary.
- Whether the output is well defined or checked. Owned by Definition of Done.

## Severity guide
- **critical:** Fires on a common, high-risk request it must not (e.g. a "delete files" skill whose description matches "show me my files"), or never fires on its core task because the description omits the core term.
- **major:** Misses a clearly in-scope phrasing that users commonly type, or a skill with a close neighbor domain gives no "do not use" guidance.
- **minor:** Description is generic ("helps with data") but routing still works, or a trigger phrase is redundant.
- **nit:** Name or description wording could be tighter, with no routing effect.

## Output
Report findings in the finding format defined in [report.md](../report.md). Zero findings is a valid result: write "No significant issues" and stop.
