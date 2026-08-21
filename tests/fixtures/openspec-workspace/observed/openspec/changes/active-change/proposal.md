## Why

Exercise the **active layout** with [local evidence](./design.md) and `inline code`.

> Render structure for reading while retaining exact source.

- ordinary item
- [x] completed task evidence
- [ ] open task evidence

| Surface | State |
| --- | --- |
| Spec | readable |

```ts
const rendered = true;
```

<script data-attack="script">globalThis.pwned = true</script>
<iframe src="https://example.com/frame"></iframe>
<style>body { display: none }</style>
<img src=x onerror="globalThis.pwned = true">

[unsafe script](javascript:globalThis.pwned=true)
[unsafe data](data:text/html,unsafe)
![remote tracker](https://example.com/tracker.png)
