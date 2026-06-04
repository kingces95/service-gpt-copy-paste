# Generic Container Parts

Container Parts are specialized by the value and key types that shape their
public surface.

`TValue` supplies value slots for sequence mutation, assignment, resizing, and
indexed writes. `TKey` supplies associative lookup and erase slots. Cursor slots
remain concept-checked, while preconditions establish ownership and ordering.

```text
ArgChecks
├─ values match the specialized container value family
├─ keys match the specialized associative key family
└─ cursors satisfy the public cursor concepts

Preconditions
├─ cursor is owned by this container
└─ cursor pairs are ordered for this operation
```

The Part hierarchy keeps its original cursor-aware base: `ContainerPart` owns
`begin`, `end`, and the shared cursor assertions. Generic specialization adds
value and key precision without making every Part carry a cursor type parameter.
