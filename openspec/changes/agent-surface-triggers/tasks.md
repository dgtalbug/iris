## 1. Surface installer

- [ ] 1.1 Generalize the managed-surface installer over a surface descriptor (template id, target, front matter, body) while preserving marker, digest, confinement, symlink, and atomic-write behavior and the existing result shape.
- [ ] 1.2 Add focused tests for descriptor-driven install, refresh, unchanged, edited-digest, unmarked, and escaping-target cases.

## 2. Command surfaces

- [ ] 2.1 Add the packaged `iris-commands` template describing the generated content actions and their one-line bodies.
- [ ] 2.2 Generate `.claude/commands/iris/<action>.md` and `.github/prompts/iris-<action>.prompt.md` for each action with host-appropriate front matter; report results from init and update.
- [ ] 2.3 Add tests that every generated command names an existing catalog command, that unrelated sibling commands are preserved, and that collisions are reported rather than overwritten.

## 3. Conversational skill

- [ ] 3.1 Rewrite the canonical skill description and body with a when-to-use intent table mapping user intent to command and generated destination, compressing existing prose to hold the size budget.
- [ ] 3.2 Add tests asserting the intent table covers every content command and that the rendered skill stays within its byte budget.

## 4. Verification and documentation

- [ ] 4.1 Extend release verification to require the command template in the package payload.
- [ ] 4.2 Update `README.md`, `docs/cmds.md`, and `docs/status.md` for the generated command surfaces and the skill's trigger contract.
- [ ] 4.3 Run `openspec validate agent-surface-triggers --strict` and the full release gate; regenerate local agent surfaces.
