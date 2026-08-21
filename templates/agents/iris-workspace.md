# Iris workspace

Use Iris to turn intentional agent work into local, versioned HTML that opens directly from `file://`.

## Setup

Run `iris init` once after installing or upgrading the CLI. It creates or safely refreshes the local `iris/` workspace, installs this agent skill, and renders the dashboard. It does not copy or monitor `README.md` or `docs/**/*.md`.

## Content workflow

1. Create intentional content with one of:
   - `iris report <id>`
   - `iris report --from-session <path> [<id>]`
   - `iris feature <id>`
   - `iris bug <id>`
   - `iris idea <id>`
   - `iris plan <id>`
2. Edit the generated `iris/pages/<id>/data.json` contract.
3. Run `iris render <id>` or `iris render --all`.
4. Open the workspace with `iris open`.

Use lowercase kebab-case page ids. Treat `data.json` as the editable source and generated `page.html`, `iris/index.html`, and design assets as CLI-owned outputs.

## Existing commands

- `iris archive <id>` moves a page into Iris history and refreshes navigation.
- `iris publish [<id>] [--output path]` creates portable standalone HTML.
- `iris export <id> --single [--output path]` creates standalone HTML; PNG and PDF remain unavailable until Iris has an approved deterministic browser policy.
- `iris update` remains compatible for refreshing managed surfaces, but setup and upgrades use `iris init`.

Never hand-edit generated HTML or design assets. Preserve user-owned configuration, pages, archives, and unrelated agent/editor files.
