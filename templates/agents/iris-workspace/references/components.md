# Electric Markdown components

The renderer compiles a small set of Markdown container fences, footnotes, and confidence badges into the design system's own token-only classes. This is the whole vocabulary — a construct not listed here does not exist, and the renderer rejects it. Plain Markdown (headings, lists, tables, fenced code, `mermaid` fences) renders unchanged alongside these.

Containers open with `::: <name> …` on their own line and close with a line that is exactly `:::`. Containers nest.

## callout

A titled admonition with an icon. Syntax: `::: callout [info|warn|danger|success] [label…]` — the first word may be a tone (default `info`); the remaining words become the label, which defaults to the tone's own name. Compiles to `.callout` with `.c-info`, `.c-warn`, `.c-danger`, or `.c-success`.

```markdown
::: callout warn Cache invalidation
The stale read window lasts as long as the TTL.
:::
```

Use `info` for the exact research question, `warn` for risks, `danger` for failure modes, `success` for the recommendation.

## evidence

The citation block every finding must carry. Syntax: `::: evidence src=<path/file.ts:line>`, quoted code or description, `:::`. The `src` parameter renders as the citation line. Compiles to `.evidence` with a `.src` line.

```markdown
::: evidence src=src/lib/agent-skills.ts:155
The marker regex anchors on the template id, so a renamed template reads as unmanaged.
:::
```

Cite only lines you actually opened. One claim, one evidence block.

## steps

An ordered call path or procedure. Syntax: `::: steps` wrapping an ordered or bullet list; the list compiles to `.steps`.

```markdown
::: steps

1. `runInitCommand` scaffolds the workspace
2. `installAgentSurfaces` writes the managed surfaces
3. `refreshDashboard` renders every page
   :::
```

## timeline

Dated or phased entries. Syntax: `::: timeline` wrapping list items of the form `- <when> :: <what>`; append `!past`, `!warn`, or `!danger` to the when part for a toned entry. Compiles to `.timeline` items with `.when` and `.what`.

```markdown
::: timeline

- 2026-08-21 :: blueprint scaffolded !past
- 2026-08-23 :: first render verified
  :::
```

Plan pages use it for migration phases; bug pages for the regression's history.

## filetree

An annotated subtree. Syntax: `::: filetree` wrapping indented plain-text lines. A line ending in `/` is a directory (`.dir`); end a file line with `*` to mark it hot (`.hot`) — the files the findings dissect; a line starting with `#` is a role note (`.note`). Compiles to `.filetree` with `.dir`, `.file`, `.hot`, and `.note` lines.

```markdown
::: filetree

# generators and loaders

src/
lib/
agent-skills.ts *
commands/
:::
```

## flow

A compact node-and-edge strip for one flow. Syntax: `::: flow` wrapping lines of `A -> B -> C`; suffix a node with `!primary`, `!danger`, or `!1`–`!4` to tone it. Compiles to `.flow` with `.node` and `.edge`.

```markdown
::: flow
client -> api -> store !danger
:::
```

Reach for a `mermaid` sequence diagram instead when the flow needs actors, loops, or notes.

## details

A disclosure fold for depth a skimming reader may skip. Syntax: `::: details [title…]`, body, `:::`; the title defaults to "Details". Compiles to `details.ds`.

```markdown
::: details Raw grep output
…
:::
```

## meter

A labelled percentage bar, one per container. Syntax: `::: meter value=<0-100> label="<label>" [tone=primary|success|warning|danger]`. Compiles to `.meter` with `.track` and `.fill`.

```markdown
::: meter value=72 label="Statements covered by the failing path" tone=success
:::
```

## footnotes

Source citations collected at the end of the page. Mark inline with `[^label]` and define `[^label]: <source>` on its own line; markers render as `sup.fn` links and the collected definitions as the `.footnotes` ordered list, numbered in order of first use. A marker with no definition renders as literal `[^label]` text — the verification checklist exists to catch exactly that.

```markdown
The digest covers the managed body.[^1]

[^1]: src/lib/agent-skills.ts — `updateManagedContent`
```

## badges

A confidence chip on every TL;DR bullet. Syntax: start a list item with `**[HIGH]**`, `**[MED]**`, or `**[LOW]**` — the leading bold marker compiles to `.badge.confidence` with `.b-success` (HIGH), `.b-warning` (MED), or `.b-danger` (LOW). Only a list item's leading marker becomes a badge.

```markdown
- **[HIGH]** The marker scheme survives in-place upgrades
- **[MED]** The picker defaults to detected hosts
```

`**[HIGH]**` means verified against the code, `**[MED]**` inferred from a partial reading, `**[LOW]**` suspected. Never let a guess render without one.
