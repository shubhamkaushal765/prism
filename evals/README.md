# Calibration set

Four skills with known, deliberately planted flaws, plus one clean control. prism should catch the planted flaws and stay quiet on the clean skill. This is a regression suite for prism's auditors. It does not judge the skills themselves.

## Cases

| Case | Planted flaws | Expected auditors |
|---|---|---|
| vague-trigger | Vague description, no trigger phrases, no when-not-to-use | Trigger & Scope |
| missing-step | Undefined variable and term, two steps out of order | Cold-Start Executor |
| unsafe-ops | Unguarded `rm -rf`, token written to a log, instructions taken from a fetched README, dead link | Adversary, Cold-Start Executor |
| stale-domain | MD5 for passwords, Python 2.7 as current, no definition of done | Domain Expert, Definition of Done |
| clean | None (control) | None at major or above |

Each case is `evals/<case>/<skill-name>/` (the skill under audit, in a folder named after its frontmatter `name`) plus `evals/<case>/expected.md` (the answer key). The answer key lists each planted flaw with its `file:line` location, the expected auditor, and the minimum severity.

## Run manually

1. Install prism (see the Install section of the root README), or work from this checkout.
2. Start an agent session in the repo root.
3. Run `/prism evals/<case>/<skill-name>`, or ask: `audit the skill at evals/<case>/<skill-name>`.
4. Open the `prism-report.md` it writes and compare it with `expected.md`.

## Scoring

- A planted flaw counts as caught if a finding from the expected auditor cites the planted location (same file, same line or the range the answer key gives) at or above the minimum severity.
- Severity order: critical > major > minor > nit.
- Clean case: any finding of severity major or above is a false positive. Every dimension verdict should be pass.
- Findings are matched by location, so after editing any eval skill, re-check the line numbers in its `expected.md` against the file.

## CI

CI runs only the static part: `skills/prism/scripts/check.mjs` on each case. It has no agent run. The `unsafe-ops` case must fail the check (dead link, exit 1), and the `clean` case must pass.

Each case's static check exits 0 with no warnings, except `unsafe-ops`, which reports one ERROR and exits 1.
