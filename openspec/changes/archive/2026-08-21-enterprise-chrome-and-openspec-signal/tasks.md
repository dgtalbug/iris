# Tasks

## 1. OpenSpec signal

- [x] 1.1 Count the Spec badge as canonical specs plus active changes in `navCounts`
- [x] 1.2 Report canonical and archived totals in the Overview spec card whether or not an active change exists
- [x] 1.3 Remove `detected_tools` from the generated `config.yaml` template
- [x] 1.4 Cover the populated-but-inactive case in tests

## 2. Initialization visibility

- [x] 2.1 Report created, updated, unchanged, and conflicted agent surfaces from `iris init`
- [x] 2.2 List installed agent surfaces and their destinations on the Commands page
- [x] 2.3 Mark a conflicted surface as not installed with its reason
- [x] 2.4 Cover the reporting output in tests

## 3. Non-text contrast contract

- [x] 3.1 Add control-boundary pairs validated at 3:1
- [x] 3.2 Add border pairs validated at a declared visibility floor, named as such in failures
- [x] 3.3 Cover both thresholds in the token contract tests

## 4. Enterprise chrome

- [x] 4.1 Raise border contrast above the floor against every surface it is drawn on, in both themes
- [x] 4.2 Move the accent to a primary blue that clears the control-boundary threshold
- [x] 4.3 Give the top bar its own surface token instead of `var(--bg)`
- [x] 4.4 Render the active navigation entry with a blue rail
- [x] 4.5 Rebuild the Overview project-docs shelf as a card grid with each document's icon and purpose

## 5. Verification

- [x] 5.1 `pnpm token-lint` passes with the new pairs
- [x] 5.2 `pnpm release:check` passes
- [x] 5.3 Regenerate with `iris init` and confirm the workspace diff is only the intended changes
