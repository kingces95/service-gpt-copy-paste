# Cursor Read/Write Split

## Status

Pinned for after the current range migration.

## Motivation

`SnapshotCursor` exposed a design pressure in the current cursor concept ladder.
It is random access, but read-only. That made it awkward that
the old random-access cursor concept owned both:

```js
at(offset)
setAt(offset, value)
```

The STL lineage suggests a cleaner split: iterator strength is about movement
and addressing, while readability and writability are separate dimensions.

## Impetus

The immediate trigger was `SnapshotCursor.at(offset)`. Unlike
`IndexableCursor`, it does not delegate bounds checks to
`IndexableContainerPart`, so it had to throw read/write bounds errors inline in
`snapshot-view.js`.

That inline throw is the local smell. It shows that the bounds/precondition
logic belongs higher in the concept hierarchy, but the old concept split was
not quite right because random access also implied indexed write.

## Concrete Win

When this quest is complete, the read/write bounds checks currently inline in
`SnapshotCursor` should move into the appropriate concepts/preconditions.

The desired result:

```text
SnapshotCursor
└─ declares its traversal/read concepts
└─ does not hand-roll random-access read/write bounds throws

Concepts
└─ own the generic random-access bounds preconditions
└─ separate read/write capability cleanly enough for read-only random access
```

That gives a crisp done condition: the local TODO in `snapshot-view.js` can be
removed because the concept system owns the check.

## STL Lineage

C++ names traversal strength directly:

```cpp
std::input_iterator<I>
std::forward_iterator<I>
std::bidirectional_iterator<I>
std::random_access_iterator<I>
std::contiguous_iterator<I>
```

But writable behavior is checked separately:

```cpp
std::indirectly_writable<I, T>
std::output_iterator<I, T>
```

Random access means the iterator can jump, compare, and compute distance. It
does not mean the position is writable. A `const_iterator` can be random access
without allowing assignment.

## Current Conflation

The older cursor model conflated several axes:

```text
ReadableCursorConcept
└─ get value

WritableCursorConcept
└─ set value

Random-access surface
└─ move
└─ at
└─ setAt
└─ compareTo
└─ distanceTo
```

That has been ergonomic, but it makes a read-only random-access cursor look like
it must provide indexed write behavior.

## Candidate Direction

The big refactor would split traversal from read/write:

```text
ReadableCursorConcept
└─ get value

WritableCursorConcept
└─ set value

SteppableCursorConcept
└─ step

CloneableCursorConcept
└─ clone

BacktrackableCursorConcept
└─ stepBack

Random-access movement concepts
└─ move
└─ compareTo
└─ distanceTo
```

Indexed read/write can be modeled as explicit capability concepts:

```text
ReadableAtCursorConcept
└─ at

WritableAtCursorConcept
└─ setAt
```

The semantic helpers would be:

```js
export function readAt(cursor, offset) {
  if (cursor instanceof ReadableAtCursorConcept)
    return cursor.at(offset)

  return cursor.clone().move(offset).value
}

export function writeAt(cursor, offset, value) {
  if (cursor instanceof WritableAtCursorConcept)
    return cursor.setAt(offset, value)

  cursor.clone().move(offset).value = value
}
```

So `.value` remains the faithful STL-style dereference operation, while
`at`/`setAt` preserve the performance escape hatch as named capabilities.

## Performance Note

Do not start with a bespoke `readAt` / `writeAt` dispatch cache. First optimize
the general `instanceof Concept` path if performance becomes a concern, because
that benefits all concept checks. A specialized operation cache can come later
if measurements justify it.

## Why Deferred

This is bigger than a side quest. It touches the public cursor concept ladder,
many cursor implementations, tests, and probably the marketing/root docs around
the STL iterator mapping.
