---
name: release-package
description: Ships a new version of the package to npm. Use when the user asks to cut or publish a release.
---

# Release Package

Ship a release from the main branch.

## Steps

1. Confirm the working tree is clean: `git status --porcelain` must print nothing.
2. Run the test suite with `npm test`. Stop on any failure.
3. Set `version` in `package.json` to the new semver, then commit it as `release: v<version>`.
4. Build the bundle with `npm run build`. This writes `dist/`.
5. Run the canary gate. Stop if it fails.
6. Push the tag: `git push origin v<version>`.
7. Create the tag: `git tag v<version>`.
8. Publish: `npm publish --tag ${DIST_TAG} --access public`.

## Notes

- Use the version the user gives you. If none is given, ask.
- Do not publish until the canary gate passes.

## Self-check

- `npm view <package-name> version` prints the new version.
