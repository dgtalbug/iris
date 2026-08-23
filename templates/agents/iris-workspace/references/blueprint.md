# The report blueprint

Every Iris narrative page is built from ten fixed sections, in this order. The renderer maps each heading to a section id (`#tldr` … `#appendix`), builds the table of contents and meta-row automatically, and omits a section only when it is truly empty. Never reorder, rename, or invent sections.

Per-type emphasis tells you where a page type spends its weight; every other section still applies.

## 1. TL;DR — `#tldr`

Three to six bullets: what was found, what to do, the risk level. Every bullet starts with a confidence badge — `**[HIGH]**`, `**[MED]**`, or `**[LOW]**`.

- Emphasis: **report** pages live here — the TL;DR plus the numbers are the page.
- Do: state the single most important finding first.
- Don't: write a bullet you have not verified without marking it `**[MED]**` or `**[LOW]**`.

## 2. Question & scope — `#question`

The exact question the page answers, in an info callout, plus a "not covered" list that bounds the scope.

- Do: quote the question as the user asked it.
- Don't: let the scope list drift into new findings — it names exclusions only.

## 3. System map — `#map`

One diagram of the territory the page covers, colored by the color law, with a one-line caption.

- Do: keep it under a dozen nodes; split larger maps.
- Don't: draw components you have not confirmed exist in the code.

## 4. Code territory — `#territory`

A `::: filetree` of the relevant subtree. Mark the files the findings dissect as hot; annotate each directory's role.

- Do: prune aggressively — the tree is a map of this page, not of the repo.
- Don't: list generated or vendored directories.

## 5. Findings — `#findings`

The core of the page. Each finding: a heading, a leading list item carrying the confidence badge (`**[HIGH]**`, `**[MED]**`, or `**[LOW]**`), prose, then `::: evidence` blocks citing `path/file.ts:line` you actually opened. Supporting code, sequence diagrams, and deep detail folded into `::: details`.

- Emphasis: **research** pages are findings-first — everything else frames them. **bug** pages put the diagnosis here and keep the failing path in the danger tone.
- Do: one claim per finding, one citation per claim.
- Don't: write a finding with no evidence block.

## 6. Metrics & measurements — `#numbers`

Stat cards for the legible numbers, `::: meter` bars for coverage, risk, and effort.

- Emphasis: **report** pages pair this with the TL;DR.
- Do: measure or count from the real source.
- Don't: invent a number to fill the grid — an omitted section disappears cleanly.

## 7. Key flows — `#paths`

`::: steps` for the main call path; `::: flow` strips or sequence diagrams per flow. Error paths use the danger treatment.

- Emphasis: **bug** pages show the failing path here, danger-marked end to end.
- Do: trace the path in the code before you draw it.
- Don't: draw a happy path when the page exists because of a failure.

## 8. Risks & unknowns — `#risks`

Warning and danger callouts. Each risk names its blast radius and the probe that would resolve the unknown.

- Do: write unknowns down — an honest unknown beats a silent guess.
- Don't: list risks without a way to resolve them.

## 9. Proposed direction — `#proposal`

The options and the call. On contract pages the design surface renders as tabs; in Markdown, give each option a `::: details` fold and settle the tradeoffs in one table. The recommendation goes in a success callout; migration phases go in a `::: timeline`.

- Emphasis: **feature** pages lead with the options; **plan** pages lead with the timeline phases.
- Do: recommend exactly one option and say why.
- Don't: present options with no tradeoffs table.

## 10. Appendix & citations — `#appendix`

Raw dumps in `::: details`; the ordered footnote list. Every footnote marker in the body resolves here to a `file:line` or a commit reference.

- Do: keep raw evidence here rather than bloating the findings.
- Don't: leave a footnote marker unresolved — the checklist fails the page.
