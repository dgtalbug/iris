## 1. Foundations

- [ ] 1.1 Archive the completed `redesign-work-board` change so the Aperture delta in this change applies on top of its requirements.
- [ ] 1.2 Split `src/templates/design.ts` into `tokens.ts`, `shell.ts`, `styles.ts`, `script.ts`, `contract-page.ts`, and `pages/*.ts`, keeping `design.ts` as a re-export barrel; point `token-lint` at the new tokens module.
- [ ] 1.3 Replace the token values with the Electra palette, add navigation-shell, accent-soft, and research type tokens in both themes, extend `token-contract` pairs, and make `token-lint` pass.
- [ ] 1.4 Emit the initial `data-theme` from `iris/config.yaml` `theme:` on every generated page while keeping the local-storage toggle override.

## 2. Navigation shell

- [ ] 2.1 Implement `renderShell()` with the nav model (Overview, Work, Spec, Commands, project docs group), depth-aware relative paths, current-section marking, breadcrumb, top-bar slot, and `data-iris-nav` marking.
- [ ] 2.2 Add shell CSS: sidebar, collapsed rail, top bar, page header, summary strip tiles, progress bar, command card, narrow-width overlay, print, reduced motion.
- [ ] 2.3 Add classic-script behavior: collapse control, `b` shortcut, `iris-nav` persistence, narrow-width menu toggle, focus management; keep `/` and `t`.
- [ ] 2.4 Adopt the shell in contract pages and project placeholders and verify publish/export strip it while the body keeps a heading and back link.

## 3. Section pages

- [ ] 3.1 Add `src/lib/command-catalog.ts` with grouped entries and statuses; generate `HELP_TEXT` from it and update the help test.
- [ ] 3.2 Generate `iris/commands.html` from the catalog with grouped command cards and textual status chips.
- [ ] 3.3 Move the Work browser, toolbar, and drawer to `iris/work.html` with a Work summary strip; keep behavior and data attributes unchanged.
- [ ] 3.4 Move the Spec view to `iris/spec.html` with the existing overview counts as its summary strip.
- [ ] 3.5 Generate the Overview at `iris/index.html`: briefing hero with quick-start commands, four section tiles, recent work, spec movement with progress bars, architecture pane, project-docs strip, all linking to section pages.
- [ ] 3.6 Retire `iris/project/commands.html` from `PROJECT_DOC_NAMES`, remove it during init/update only when it carries the managed marker, and report unmanaged copies.

## 4. Verification and documentation

- [ ] 4.1 Update `html-navigation`, `work-board`, `openspec-browser`, `cli-help`, `publish-export`, and `token-contract` tests for the new page set; add tests for shell links at every depth, collapsed-state markup, commands-page statuses, overview summaries, and empty states.
- [ ] 4.2 Regenerate the checked-in `iris/` output, run `pnpm html-check`, and inspect Overview, Work, Spec, Commands, and one contract page at desktop and 360 px in both themes.
- [ ] 4.3 Update `README.md`, `docs/cmds.md`, `docs/design-system.md` (tokens, IA, component inventory), `docs/status.md`, and the canonical skill template's dashboard sentence.
- [ ] 4.4 Run `openspec validate dashboard-shell-redesign --strict` and the full release gate; reconcile task evidence with the implementation.
