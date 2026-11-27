# Judge pass

Used by [../SKILL.md](../SKILL.md) step 5. The judge checks every auditor finding against the real file before anything reaches the report.

Input: every auditor's findings in the LOCKED format (see [report.md](report.md)), the target path, the profile and the roster.

Output: verified findings in the LOCKED format, a count of dropped findings by reason, the list of unverified claims, and a dimension verdict table.

## 1. Verify each quote against the file

1. Open the cited path and find the quote.
2. The quote is on the cited line: keep the finding.
3. The quote is on a different line of the same file: correct the line number and note "line corrected" in the finding.
4. The quote is absent from the file: drop the finding as hallucinated.
5. Absence findings (for example "no examples", "no trigger phrases"): the cited quote is the heading or first line of the section where the content should be. If that heading does not exist, drop the finding.
6. The quote exists but does not show the claimed problem: drop the finding.

## 2. Check the fix

1. The fix must name a concrete change at the cited place. "Improve clarity" is not a fix. Drop such a finding, or rewrite the fix yourself if the problem is real.
2. Prefer a unified diff. Check that the diff's removed lines match the file.

## 3. Merge duplicates

1. Same location and same problem, even from different auditors: one finding.
2. Keep the strongest verified quote, the severity the evidence supports, and the most concrete fix.
3. Credit every contributor in the Auditor field, for example `Cold-Start Executor + Trigger & Scope`.
4. Same problem at several locations and one shared fix: keep one finding. Cite the main location in Evidence and list the others in Fix.

## 4. Resolve conflicts

A conflict is two auditors that disagree about the same text (one says cut, one says expand; one says the instruction is clear, one says it is ambiguous). Apply these rules in order:

1. **Stated intent arbitrates.** If the skill's stated intent favors one side, keep that side and say so in the finding.
2. **A bug outranks taste.** A bug finding on the same text beats a taste finding. The taste finding moves to the taste section or is dropped.
3. **Correctness outranks token savings.** If cutting the text would break correctness or stop the executor from following the steps, keep the text.
4. **Unresolved.** Keep one finding titled "Conflict: <short topic>". Put both options in Fix as "Option A: ... Option B: ...". Do not choose. Set Confidence: low. Kind is taste unless one side is a bug.

## 5. Recalibrate severity and confidence

Severity uses the meanings in [report.md](report.md). An auditor's severity is a claim. Set it to what the verified evidence supports: lower it when the failure needs an unlikely input, raise it when a common input hits the problem.

Confidence:

- **high**: quote verified, and the failure is shown by a traced step or by an empirical transcript.
- **medium**: quote verified, and the failure depends on an assumption you state in the finding.
- **low**: plausible from the quote alone, or it depends on something outside the file.

## 6. Keep bug and taste apart

- **Bug**: a concrete input or step where the skill fails, misleads or causes harm. Name that input or step in Evidence or Fix. If you cannot name one, it is taste.
- **Taste**: wording, style, or a better way the skill does not need.
- Keep bug and taste findings in one numbered list; the report routes taste findings to its own section.

## 7. Mark unverified Domain Expert claims

A Domain Expert claim with no source, or with a source that cannot be checked, is kept only if it is useful. Prefix its title with "UNVERIFIED:" and set Confidence: low. Never call an unverified claim wrong.

If a checked source contradicts the claim, it is a verified finding. Put the source in Fix.

## 8. Enforce the stopping rule

Drop padding:

- restatements of a finding already kept,
- nits with no concrete change,
- generic advice ("could be more concise") with no quoted cost,
- findings whose fix is only "consider",
- fixes that remove an example, a check or a safety rule only to save tokens.

Keep a nit only when it is cheap and its fix is concrete.

If nothing remains, the report says "no significant issues found", and every dimension verdict is pass.

## 9. Lite mode self-check

Lite mode has no separate judge. After playing the lenses:

1. Reopen the file and recheck each quote (steps 1-2).
2. Apply steps 3-8 to your own list.
3. Drop every finding you cannot re-verify.

## 10. Dimension verdicts

Dimension names are in [report.md](report.md). For each dimension that ran:

- **fail**: at least one verified critical or major bug with high or medium confidence.
- **concern**: any other verified minor or major finding.
- **pass**: no verified findings, or nits only.

There are no numeric scores.

## 11. Output

1. Verified findings in the LOCKED format, numbered F1..Fn. Sort by severity (critical first), then confidence (high first), then bug before taste. Keep taste findings in this list so the report can route them to the taste section.
2. Dropped counts by reason: hallucinated quote, quote does not support the claim, duplicate merged, padding, no concrete fix.
3. Dimension verdict table: Dimension | Verdict | Finding IDs.
4. Unverified claims (title and source status).
