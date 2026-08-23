---
title: ERD
status: draft
---

# ERD

The data model of `__PROJECT__`: entities, their fields, and the relationships between them. Replace the placeholder entities with the real ones.

## Entities

```mermaid
erDiagram
  ENTITY_A {
    string id PK
    string name
  }
  ENTITY_B {
    string id PK
    string entity_a_id FK
  }
  ENTITY_A ||--o{ ENTITY_B : "has"
```

## Notes

Field meanings the name alone does not carry, constraints and keys, and the lifecycle of each record.
