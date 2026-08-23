---
title: HLD
status: draft
---

# HLD

High-level design: the shape of `__PROJECT__` and how its parts fit together. Replace the placeholder nodes below with the real components and keep the `classDef` lines so colours keep their meaning: violet is the thing being described, cyan a service, amber a data store, lime an async path, pink an external system, red an error path.

## System map

```mermaid
flowchart LR
  app["__PROJECT__"]:::focus
  svcA["Service A · replace me"]:::svc
  store[("Store · replace me")]:::db
  ext["External system · replace me"]:::ext
  app --> svcA --> store
  app -.-> ext
  classDef focus stroke:#8b5cf6,stroke-width:2.5px,fill:transparent,color:#8b5cf6;
  classDef svc   stroke:#22d3ee,fill:transparent,color:#22d3ee;
  classDef db    stroke:#fbbf24,fill:transparent,color:#fbbf24;
  classDef q     stroke:#a3e635,fill:transparent,color:#a3e635;
  classDef ext   stroke:#f472b6,fill:transparent,color:#f472b6;
  classDef err   stroke:#f87171,fill:transparent,color:#f87171,stroke-dasharray:4;
```

## Boundaries

Which subsystems exist, what crosses each boundary, and what deliberately does not.

## External dependencies

| Dependency | Why it is here |
| ---------- | -------------- |
| Replace me | Replace me     |
