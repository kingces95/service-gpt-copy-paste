# Algorithm Dispatch

Fast paths should be earned by capability, not guessed by type name.

STL algorithms feel good because they ask what an iterator can do. The same
shape works in JavaScript when cursor concepts are runtime-visible.

## The JavaScript Idiom

A distance helper usually mutates a cursor until it reaches the end.

```js
function distance(range) {
  const first = range.begin()
  const last = range.end()
  let count = 0

  while (!first.equals(last)) {
    first.step()
    count++
  }

  return count
}
```

That works for single-step cursors, but it is wasteful for random access
cursors and it may move an object the caller still cares about.

## Declarative Translation

Dispatch on the cursor capability.

```js
function distance(range) {
  const first = range.begin()
  const last = range.end()

  if (first instanceof RandomAccessCursorConcept)
    return first.distanceTo(last)

  let count = 0
  first = first.clone()

  while (!first.equals(last)) {
    first.step()
    count++
  }

  return count
}
```

The same algorithm now respects richer cursors:

```js
distance(vector) // O(1)
distance(list) // stepping fallback
```

## Why This Matters

The fast path is not a special case for `VectorMap`; it is a consequence of a
named capability.

That is the STL translation at work: algorithms stay generic, containers opt
into stronger cursor categories, and performance improves without erasing the
common protocol.

## Lineage

STL iterator categories let algorithms choose better implementations without
hard-coding container types.

```cpp
std::distance(first, last)
```

The JavaScript translation uses runtime cursor concepts:

```js
if (first instanceof RandomAccessCursorConcept)
  return first.distanceTo(last)
```

Random-access cursors earn the fast path; weaker cursors still work through
the generic stepping path.
