## 1. Tokens 2.0

- [x] 1.1 Replace the generated dark/light palette, spectrum, type, radius, leading, elevation, and motion tokens with the Aperture contract.
- [x] 1.2 Extend token lint to validate declared references and 4.5:1 contrast pairs in both themes.
- [x] 1.3 Add regression coverage for the expanded token contract and contrast failures.

## 2. Components 2.0

- [x] 2.1 Restyle the shared base components and add aperture, stat-tile, pill, callout, timeline, kbd, and command-specific empty-state styles.
- [x] 2.2 Update page/dashboard markup so type and status color always has a text, icon, or position signal.
- [x] 2.3 Preserve visible focus, reduced-motion static presentation, classic-script behavior, and print styling.

## 3. Dashboard information architecture

- [x] 3.1 Reorder the dashboard into briefing hero, health strip, architecture placeholder, work surface, and docs strip.
- [x] 3.2 Preserve `/` filter and `t` theme shortcuts and make the layout usable at 360 px.
- [x] 3.3 Update initialization/render inputs and tests for deterministic briefing and empty-state content.

## 4. Dogfood and verification

- [x] 4.1 Regenerate the checked-in `iris/` tree through the CLI without hand-editing generated output.
- [x] 4.2 Verify OpenSpec, token lint, HTML integrity, tests, and install smoke gates.
