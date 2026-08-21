## 1. Data bundle

- [x] 1.1 Add a bundle builder that keys each canonical spec, change, and legacy archive by kind and name and carries its pre-rendered detail HTML, title, and source path.
- [x] 1.2 Encode the bundle so `<`, `U+2028`, and `U+2029` cannot terminate the script element or an HTML comment, and add tests using a record whose content contains `</script>` and an HTML comment close.
- [x] 1.3 Emit the bundle at `iris/spec/data.js` from the render pipeline and stop generating per-record detail pages.

## 2. Spec page routing

- [x] 2.1 Render the index plus an empty detail region with a `noscript` explanation, and address each index row by its record hash.
- [x] 2.2 Add hash-routed record display to the classic script: show the record, mark the breadcrumb, restore focus, return to the index on an empty or unknown hash, and re-fire the visibility event so Mermaid renders inside a shown record.
- [x] 2.3 Keep the index complete without scripts, with every row still naming its on-disk source path.

## 3. Verification and documentation

- [x] 3.1 Move per-record file assertions to bundle records; add tests for index-row-to-bundle-key integrity, unknown-hash behavior, missing artifacts, and nested capability paths.
- [x] 3.2 Regenerate the checked-in output, confirm the generated HTML count drops to the section, project, and content pages, and run `pnpm html-check`.
- [x] 3.3 Update `docs/cmds.md`, `docs/design-system.md`, `docs/tech.md`, and `docs/status.md` for the bundle, recording the measured `file://` constraint that forces it.
- [x] 3.4 Run `openspec validate spec-data-bundle --strict` and the full release gate.
