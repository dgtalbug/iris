## Why

The project already models the page lifecycle around structured reports, but the workflow still depends on manual curation for session-derived work. Users are generating meaningful session artifacts locally yet the CLI does not fully convert that evidence into a reusable report contract, dashboard entry, or rendered artifact.

## What Changes

- Add a session ingestion path that turns local session data into a consistent report contract.
- Normalize session metadata, checkpoint summaries, and tool activity into a report-friendly structure.
- Attach file and reference evidence so the generated page is traceable back to the original work.
- Render the resulting report in the same dashboard-first flow used by other `iris` pages.

## Capabilities

### New Capabilities
- session-ingestion-and-reporting: import session history into a structured page and render the output in the project dashboard.

### Modified Capabilities
- report: expand the report workflow to accept session-derived input in addition to manual page creation.

## Impact

- Session-to-report conversion becomes repeatable instead of ad hoc.
- Users can preserve and review AI work without losing evidence from prompts, tools, and checkpoints.
- Reports become more trustworthy because they are grounded in actual work artifacts and branch context.
