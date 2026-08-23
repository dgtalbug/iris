---
title: ERD
status: active
---

# ERD

The data model of `iris`. Every entity here is a file on disk — there is no database, and nothing is stored outside the repository it describes.

## Entities

```mermaid
erDiagram
  PROJECT_STATE {
    int version "always 2"
    map page_index "id to registry entry"
  }
  PAGE_REGISTRY_ENTRY {
    string id PK
    string type
    string title
    string status "active or archived"
  }
  CONTRACT {
    string iris PK "contract version"
    string type "report feature bug idea plan"
    string id
    string title
    string status "draft active done archived"
    string agent "claude-code codex copilot other"
    string created
    string updated
    string commit
    array tags
    object sections "shape decided by type"
  }
  RESEARCH_DOC {
    string id PK "directory name"
    string title "front matter, falls back to first heading"
    string status "front matter, falls back to draft"
    array tags
    string agent
    string updated
  }
  PROJECT_DOC {
    string name PK "overview hld lld erd decisions"
    string title
    string status
  }
  SPEC_SNAPSHOT {
    int version
    array specs "canonical capabilities"
    array changes "active and archived"
    array warnings "per path, isolated"
  }
  RENDERED_PAGE {
    string path PK
    string source_kind "contract markdown"
  }

  PROJECT_STATE ||--o{ PAGE_REGISTRY_ENTRY : "indexes"
  PAGE_REGISTRY_ENTRY ||--|| CONTRACT : "points at"
  CONTRACT ||--|| RENDERED_PAGE : "renders to"
  RESEARCH_DOC ||--|| RENDERED_PAGE : "renders to"
  PROJECT_DOC ||--|| RENDERED_PAGE : "renders to"
  SPEC_SNAPSHOT ||--o{ RENDERED_PAGE : "feeds"
```

## Notes

**The envelope is the contract.** `schemas/envelope.schema.json` requires all eleven fields on every record; `sections` is then validated against the per-type schema, so `bug` carries `symptom`/`severity`/`timeline`, `feature` carries `problem`/`goal`/`design`/`tasks`, `idea` carries `current_state`/`proposed`/`effort_impact`, `plan` carries `goal`/`steps`, and `report` carries `summary`/`open_items`/`promotable_as`. An invalid contract blocks rendering rather than producing a partial page.

**Research is Markdown-first.** `iris/research/<id>/index.md` is the editable source and `page.html` is generated output. Only five front-matter keys are read — `title`, `status`, `tags`, `agent`, `updated` — and each missing or malformed one degrades to a per-path warning rather than failing the render.

**State is deliberately thin.** `ProjectState` is version 2 and holds only the page registry needed for active/archive navigation. The version 1 shape carried `last_synced_sha`, `content_hashes`, a `stale` status, and per-entry source hashes; it is read only long enough to prove a legacy mirror is an unmodified Iris output before removing it, and every ambiguous record is preserved.

**The spec snapshot is generated, not authored.** `iris/spec.json` is a deterministic snapshot of the `openspec/` filesystem with no timestamp, replaced atomically by `iris init`, bare `iris render`, and `iris render --all`. Every other command reuses it, so there is no watcher.

**Identity is the directory name.** A page's `id` is its directory under `iris/pages/` or `iris/research/`; there is no separate key, which is why `iris <type> <id>` refuses a duplicate or malformed id up front.
