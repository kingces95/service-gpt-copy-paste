# Bulk Editable Containers

## Status

Pinned for after the current range migration stabilizes.

## Motivation

`BulkEditableContainerPart` now has a cleaner semantic role:

```text
insertRange(cursor, sourceRange)
eraseRange(first, last)
resizeTo(count, value)
assignRange(sourceRange)
replaceRange(first, last, sourceRange)
```

`GapEditableContainerPart` proved that shared implementation can work for
array-like containers using `openGap$` / `closeGap$`. So far the proof is
centered on `Vector` and `VectorMap`.

The next larger step is to add the bulk surface to the other sequence
containers where it makes sense.

## Impetus

While migrating from `first`/`last` source pairs to source ranges, it became
clear that these operations are not just algorithms. They mutate container
shape, so the container must participate.

At the same time, the public ergonomics are valuable enough that the sequence
containers should eventually expose them consistently.

## Concrete Win

When this quest is complete, the sequence containers that can honestly support
bulk editing should expose the same STL-ish bulk API. Tests should be able to
run a declaration-first cross product over containers and bulk operations,
rather than treating bulk editing as vector-only behavior.

Expected win:

```text
BulkEditableContainerPart
└─ Vector
└─ VectorMap
└─ Deque
└─ Chain/List where appropriate

GapEditableContainerPart
└─ Vector
└─ VectorMap
```

Deque may use a direct library-backed splice implementation rather than the gap
default. Node containers may need their own node/splice-flavored implementation.

## Container Notes

### Vector

Already uses `GapEditableContainerPart`.

```text
openGap$
closeGap$
sourceRange$
```

The typed-vector path is the best proof of the gap abstraction because `copy`
can use contiguous optimizations.

### VectorMap

Already extends `GapEditableContainerPart`, but overrides `insertRange` to use
one native `Array.splice` with real values.

This is intentional: the container is gap-editable, but the best bulk insert
primitive is splice-with-values.

### Deque

The current wrapper uses `denque`, which exposes public `splice` / `remove`.
That means Deque probably can implement `BulkEditableContainerPart` directly
without hand-rolling internal block movement.

It should probably not start with `GapEditableContainerPart`, because the clean
gap default expects efficient writable indexed slots. A gap implementation using
`denque.splice(index, 1, value)` per copied item would be correct but likely
poor.

### List / Chain

Node containers fit the semantic bulk API, but not necessarily the gap
implementation. `Chain` has bidirectional/node operations that may support
STL-like `list` behavior. `List` / forward-list-like APIs expose the recurring
`after` wrinkle.

Forward-only containers may deserve a separate after-position bulk surface,
mirroring STL `forward_list`:

```text
insertRangeAfter(cursor, sourceRange)
eraseRangeAfter(first, last)
```

Do not force all sequence helpers to pay the `after` complexity unless the
abstraction proves worth it.

## STL Lineage

STL exposes semantic container operations:

```cpp
c.insert(pos, first, last)
c.erase(first, last)
c.resize(count, value)
c.assign(first, last)
```

But implementation is container-specific:

```text
vector
└─ open gaps in contiguous storage

deque
└─ shift through block-map representation

list
└─ allocate/link nodes

forward_list
└─ after-cursor operations
```

The local translation should preserve the same semantic API where possible, but
use representation-specific Parts/hooks underneath.

## Open Questions

- Should the public name stay `BulkEditableContainerPart`, or become more
  explicitly sequence-oriented?
- Should Deque get a `SpliceEditableContainerPart`, or just a direct
  `BulkEditableContainerPart` implementation?
- Should `List` and `Chain` share a node-bulk Part, or remain direct
  implementations until patterns repeat?
- Should forward-list-like containers get parallel `After` helpers rather than
  trying to fit `insertRange(cursor, range)`?
