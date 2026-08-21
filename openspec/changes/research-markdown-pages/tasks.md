## 1. Source contract

- [ ] 1.1 Implement the bounded front-matter parser (scalar, inline list, block list; validation of status, updated, tags) with warnings and focused tests including malformed and hostile input.
- [ ] 1.2 Implement research discovery under `iris/research/` (sorted, symlink-refusing, path-confined, size- and count-bounded) returning items plus path-specific warnings, with tests.
- [ ] 1.3 Add `iris research <id>` to the draft command: kebab-case validation, duplicate check across pages/research/archive, compact skeleton with front matter and the four headings; add the catalog entry and CLI test.

## 2. Rendering

- [ ] 2.1 Add opt-in heading ids and heading extraction to `renderSafeMarkdown` without changing OpenSpec output; test slug determinism and collision handling.
- [ ] 2.2 Implement the research document template inside the shared shell: header from front matter with unavailable labels, table of contents rule, safe body, Mermaid hosts, print and 360 px styles.
- [ ] 2.3 Generate `iris/research.html` with summary strip, filterable list, tag signals, and the populate-command empty state; add the Research entry to the navigation model.
- [ ] 2.4 Extend the dashboard projection with research records (type, status, bounded description, evidence) so Work views and drawer cover them; add `tp-research` styling and Overview/Work counts.

## 3. Lifecycle

- [ ] 3.1 Record the source root in the page registry (additive field, version 2 retained) and resolve it in archive; move research folders under `iris/archive/<id>/` and keep links working.
- [ ] 3.2 Resolve research and archived research pages in publish and export; verify the standalone artifact omits the shell and stays self-contained.
- [ ] 3.3 Update the canonical `iris-workspace` skill template with the research workflow and regenerate the installed skill surfaces.

## 4. Verification and documentation

- [ ] 4.1 Add end-to-end tests: skeleton creation, render with and without front matter, malformed front matter warning, hostile body, TOC presence, Work projection, filter/drawer attributes, archive, publish, and html-check integrity.
- [ ] 4.2 Write a dogfood research page from the existing agent hand-off content under `iris/research/`, regenerate output, and inspect desktop and 360 px in both themes.
- [ ] 4.3 Update `README.md`, `docs/cmds.md`, `docs/tech.md`, `docs/status.md`, and `docs/design-system.md` for the research contract and page.
- [ ] 4.4 Run `openspec validate research-markdown-pages --strict` and the full release gate; reconcile task evidence with the implementation.
