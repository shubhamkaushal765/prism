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

Each case is `evals/<case>/skill/` (the skill under audit) plus `evals/<case>/expected.md` (the answer key). The answer key lists each planted flaw with its `file:line` location, the expected auditor, and the minimum severity.

## Run manually

1. Install prism (see the Install section of the root README), or work from this checkout.
2. Start an agent session in the repo root.
3. Run `/prism evals/<case>/skill`, or ask: `audit the skill at evals/<case>/skill`.
4. Open the `prism-report.md` it writes and compare it with `expected.md`.

## Scoring

- A planted flaw counts as caught if a finding from the expected auditor cites the planted location (same file, same line or the range the answer key gives) at or above the minimum severity.
- Severity order: critical > major > minor > nit.
- Clean case: any finding of severity major or above is a false positive. Every dimension verdict should be pass.

## CI

CI runs only the static part: `skills/prism/scripts/check.mjs` on each case. It has no agent run. The `unsafe-ops` case must fail the check (dead link, exit 1), and the `clean` case must pass.

Every case folder is named `skill`, so check.mjs warns that `name` does not match the directory. That WARN is expected and does not fail the run.
