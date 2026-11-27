# Contributing to prism

This page is for maintainers. If you only want to use prism, start with the [README](README.md).

## Dev commands

```
npm test         # node --test: runs the suites in test/
npm run check    # structural check of skills/prism, then the version sync check
```

`npm run check` runs `skills/prism/scripts/check.mjs` on the prism skill (for example, it flags broken relative links), then `scripts/check-versions.mjs`.

## Repo layout

- `skills/prism/`: the skill. `SKILL.md`, `references/` (selection, judge and report rules, one persona file per auditor), and `scripts/check.mjs`.
- `cli/prism.mjs`: the installer behind `npx shubhamkaushal765/prism`.
- `evals/`: calibration set of skills with planted flaws, plus one clean control.
- `docs/brand.md`: the brand guide.
- `assets/`: logo, wordmark and Facet SVGs.
- `test/`: node:test suites.
- `scripts/check-versions.mjs`: version sync check.
- `.claude-plugin/`: plugin and marketplace manifests.
- `.github/workflows/`: CI and release.

## Running the evals

Each case lives at `evals/<case>/<skill-name>/`, with an answer key at `evals/<case>/expected.md`. Cases: `vague-trigger`, `missing-step`, `unsafe-ops`, `stale-domain`, and `clean`.

1. Start an agent session in the repo root.
2. Ask: `audit the skill at evals/<case>/<skill-name>`, or run `/prism evals/<case>/<skill-name>`.
3. Compare the resulting `prism-report.md` with `evals/<case>/expected.md`. Each planted flaw should be caught by the expected auditor at or above the stated severity. The clean case should produce no major or critical findings.

Scoring rules are in [evals/README.md](evals/README.md). CI runs only the static check on each case, not agent runs.

## Version sync

The `version` field must be identical in three files:

- `package.json`
- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`

`npm run check` enforces this.

## Release

1. Bump `version` to the new number in the three files above.
2. Push a tag named `vX.Y.Z` that matches that version.

The release workflow (`.github/workflows/release.yml`) runs on tags matching `v*`. It fails if the tag does not match `package.json`, runs the tests and checks, then publishes to npm with provenance. It needs an `NPM_TOKEN` repository secret.

## Brand assets

The colors, logo use and Facet guidelines are in [docs/brand.md](docs/brand.md). Use the files in `assets/` rather than redrawing them.
