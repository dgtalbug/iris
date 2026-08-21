## 1. Session source parsing

- [x] 1.1 Define the supported input shapes for the session ingestion workflow.
- [x] 1.2 Implement a source adapter for local session directories and exported session dumps.
- [x] 1.3 Validate that the parser can discover session metadata, turns, checkpoints, and references without requiring a remote service.

## 2. Report normalization

- [x] 2.1 Map session evidence into a canonical report contract.
- [x] 2.2 Preserve branch, repo, timestamps, files touched, and reference links as structured fields.
- [x] 2.3 Add a clean fallback for incomplete or partial data.

## 3. Summary generation and validation

- [x] 3.1 Build concise summary logic from session checkpoints and tool activity.
- [x] 3.2 Surface workstream, status, and notable evidence in the report output.
- [x] 3.3 Add validation rules to reject empty or malformed session sources.

## 4. Rendering and registration

- [x] 4.1 Generate or update the page record in the local registry.
- [x] 4.2 Render the session-derived report through the normal HTML pipeline.
- [x] 4.3 Verify the resulting page is discoverable in the generated dashboard or index.

## 5. CLI and regression coverage

- [x] 5.1 Wire the `report --from-session` command to the new adapter and output path.
- [x] 5.2 Add regression tests for supported session inputs and bad input handling.
- [x] 5.3 Document the expected usage and output contract for the session import flow.
