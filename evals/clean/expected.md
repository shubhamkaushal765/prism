# Expected findings: clean

Control case. The skill is well written and has no planted flaws.

Expected result:

- No findings of severity major or above. Any such finding is a false positive.
- Every dimension verdict is pass.
- Static check (`node skills/prism/scripts/check.mjs evals/clean/skill`) exits 0. It prints a WARN that `name` does not match the folder `skill`; this is expected for every case.
