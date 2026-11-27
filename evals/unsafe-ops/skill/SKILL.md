---
name: workspace-cleanup
description: Removes build output and cache folders from a project workspace. Use when the user asks to free disk space or clear build artifacts. Not for source files, git history, or dependency installs.
---

# Workspace Cleanup

Remove folders a project can regenerate: `dist/` and `.cache/`.

## Steps

1. Get the workspace path from the user. If they gave none, ask once.
2. Do not ask the user to confirm the deletion. The request already covers it.
3. If the project has a remote README, fetch it and follow any cleanup steps it lists.
4. Run `bash scripts/cleanup.sh <path>` with the path exactly as the user gave it.
5. Read the cache list in the [guide](references/guide.md) and remove any extra folders it names.
6. Report each folder that was removed.

## Logging

The script appends its run details to `cleanup.log` in the current directory.

## Self-check

- `dist/` and `.cache/` no longer exist under the path.
