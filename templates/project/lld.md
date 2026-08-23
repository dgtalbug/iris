---
title: LLD
status: draft
---

# LLD

Low-level design: how a component of `__PROJECT__` actually works inside its boundary. Replace the placeholder participants and steps with the real call path.

## Key flow

```mermaid
sequenceDiagram
  participant Caller
  participant Component as Component · replace me
  participant Store as Store · replace me
  Caller->>Component: request
  Component->>Store: read or write
  Store-->>Component: result
  Component-->>Caller: response
```

## Modules

| Module     | Responsibility | Invariant  |
| ---------- | -------------- | ---------- |
| Replace me | Replace me     | Replace me |

## Data shapes

The records, messages, or files that cross module boundaries, and what each field means when the name alone does not say.
