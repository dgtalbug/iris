## 1. Publish pipeline

- [x] 1.1 Define the output contract for the standalone publish command.
- [x] 1.2 Implement the render-to-artifact transformation for a portable HTML page.
- [x] 1.3 Ensure the generated file can be opened without the project tree present.

## 2. Export handling

- [x] 2.1 Add the base export flow and output-path handling.
- [ ] 2.2 Implement each supported export mode from the CLI contract.
- [x] 2.3 Add clear error handling for unsupported or invalid export requests.

## 3. Asset bundling and offline safety

- [x] 3.1 Identify CSS, fonts, and other required assets that must be bundled or vendored.
- [x] 3.2 Add local asset resolution for publish and export outputs.
- [x] 3.3 Validate that the exported artifact works without network access.

## 4. Regression and rollout

- [x] 4.1 Add smoke tests for publish and export commands against existing generated pages.
- [x] 4.2 Confirm the output path and naming conventions match the documented CLI behavior.
- [x] 4.3 Document the supported publish/export modes and limitations for users.
