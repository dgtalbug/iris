## 1. Template and registry foundation

- [x] 1.1 Define the template registry and contract-to-template mapping for report, feature, bug, idea, and plan types.
- [x] 1.2 Add validation gating so invalid contracts fail before any page output is written.
- [x] 1.3 Implement the first core templates and ensure they respect the existing tokenized design system.

## 2. Render pipeline and tests

- [x] 2.1 Update the render command to read the registry and produce deterministic page HTML.
- [x] 2.2 Refresh the dashboard and page-index output when pages are rendered.
- [x] 2.3 Add render tests for template selection, validation failures, and stable output snapshots.

## 3. Distribution and report features

- [x] 3.1 Implement local publish/export artifact generation for a portable static page.
- [x] 3.2 Add session-derived report extraction for local agent artifacts.
- [x] 3.3 Document the publish/report command surface and install story.

## 4. Verification and review

- [x] 4.1 Run lint, typecheck, and relevant tests for the new rendering flow.
- [x] 4.2 Review the change against the acceptance criteria and keep scope limited to the M2 slice.
