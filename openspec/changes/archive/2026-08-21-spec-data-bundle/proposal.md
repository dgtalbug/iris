## Why

The Spec section generates one HTML file per record — 30 of the workspace's 41 pages — which grows linearly with the OpenSpec history and makes the generated tree dominated by archive material nobody opens. Browsers block `fetch` and `XMLHttpRequest` on `file://`, so a page cannot read a sibling Markdown file at view time; the one local mechanism that does work is a classic script assigning to a global, which is already how the vendored Mermaid runtime loads. Iris is an installed local CLI whose output is read in a real browser, so relying on that mechanism for the Spec section is acceptable where relying on it for shareable artifacts would not be.

## What Changes

- Replace the per-record Spec detail pages with one generated classic-script data bundle at `iris/spec/data.js` holding each record's pre-rendered detail HTML, and render detail into `iris/spec.html` from a local hash route.
- Keep the Spec index exactly as it is: summary strip, compact tables, project context, and warnings, with each row now addressing a record by hash instead of a separate file.
- Escape the bundle so no record's content can terminate the script element or introduce executable markup, including artifacts that legitimately contain `</script>` as escaped evidence.
- State the JavaScript requirement honestly: without scripts the index remains complete and every row still names its on-disk source path, and the page says so rather than appearing broken.
- **BREAKING** (generated output only): `iris/spec/**/page.html` files are no longer generated. Contracts, research pages, published artifacts, and every other section are unaffected.

## Capabilities

### Modified Capabilities

- `openspec-spec-browser`: the index-and-detail requirement changes from one file per record to one index plus a data bundle addressed by hash, and gains an explicit no-script behavior and a bundle-safety requirement.
- `aperture-design-system`: the workspace hierarchy requirement changes because Spec is one page again rather than a page per record.

## Impact

- `src/templates/pages/spec-detail.ts` becomes a bundle builder; `workspace.ts` emits `spec/data.js` instead of detail pages; `script.ts` gains the hash-routed spec browser; `render.ts` writes the bundle.
- Generated HTML drops from 41 files to 11 plus one data file; the Spec index gains a detail region.
- `html-check` sees fewer references; `openspec-browser` and `spec-detail-pages` tests move from per-record files to bundle records.
- No new dependency, network access, schema change, or CLI command. Published and exported artifacts are untouched because the Spec section is never published.
