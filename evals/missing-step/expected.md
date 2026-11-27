# Expected findings: missing-step

| Planted flaw | Location | Expected auditor | Min severity |
|---|---|---|---|
| "canary gate" is an undefined term; no definition or command is given | SKILL.md:16 | Cold-Start Executor | major |
| Step 6 pushes the tag before step 7 creates it (wrong order) | SKILL.md:17-18 | Cold-Start Executor | major |
| `${DIST_TAG}` is used but never defined or given a default | SKILL.md:19 | Cold-Start Executor | major |
