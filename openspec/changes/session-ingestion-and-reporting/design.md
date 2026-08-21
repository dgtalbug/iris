## Context

The repository already defines a report contract and exposes a `report --from-session` command in the CLI contract docs. The missing work is the implementation path: turning session evidence into a normalized report, grounding the output in session files or checkpoints, and keeping the output in the same local-first rendering pipeline as other `iris` pages.

## Goals / Non-Goals

**Goals:**
- Parse one or more session sources into a normal report record.
- Extract branch names, work summaries, files touched, and references without requiring a PR to exist.
- Keep the output deterministic and reviewable for later rendering.
- Integrate the report into the existing page registry and dashboard flow.

**Non-Goals:**
- Remote session syncing or SaaS ingestion.
- Full AI summarization beyond local, rule-based evidence extraction.
- Replacing the manual report path when a user prefers to author a page by hand.

## Decisions

- Keep the ingestion pipeline local-first and file-based; support directories, dumped session JSON, and known session metadata tables.
- Normalize the data into a canonical report schema before rendering so the rest of the engine can stay mostly unchanged.
- Prefer factual extraction from session metadata over high-risk inference; the generated summary should be concise and evidence-backed.
- Treat file paths, references, and checkpoints as first-class evidence rather than optional notes.

## Risks / Trade-offs

- [Noisy session data] → Mitigation: filter to known session tables and ignore irrelevant files while keeping the evidence path visible.
- [Over-aggressive summarization] → Mitigation: use deterministic summaries based on session metadata and selective evidence, not freeform AI generation.
- [Diverse session input formats] → Mitigation: support a small set of canonical adapters rather than a broad, unstable import matrix.

## Migration Plan

1. Map the session source format to a canonical internal report structure.
2. Add metadata extraction for branch, summary, files, and references.
3. Implement summary generation and validation rules for the resulting page contract.
4. Render and register the report in the standard page output flow.
5. Validate the CLI command with real session inputs and regression tests.

## Open Questions

None at this stage; the implementation should remain narrow and evidence-driven.
