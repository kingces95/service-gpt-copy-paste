# Materialized Range

When an algorithm needs two passes, make the copy explicit.

Single-pass ranges are honest but inconvenient. Sometimes an operation needs a
size, an index, or a stable snapshot. Materialization gives that need a name.

## The JavaScript Idiom

JavaScript code often solves this by quietly spreading into an array.

```js
function insertRange(target, position, values) {
  values = [...values]

  for (const value of values)
    target.insert(position++, value)
}
```

The copy is doing real semantic work, but it reads like a convenience trick.

## Declarative Translation

Name the operation as a cursor algorithm.

```js
function materialize(range, Type = VectorMap) {
  const result = new Type()
  const first = range.begin()
  const last = range.end()

  while (!first.equals(last)) {
    result.push(first.value)
    first.step()
  }

  return result
}
```

Then an insertion algorithm can normalize its input deliberately:

```js
function insertRange(target, at, range) {
  const buffer = materialize(range)

  for (let cursor = buffer.begin(); !cursor.equals(buffer.end()); cursor.step())
    target.insert(at, cursor.value)
}
```

In the container bulk-edit surface, this became a policy hook:

```js
sourceRange$(range) {
  const first = range.begin()
  if (first.range == this)
    return snapshot(range)

  return range
}
```

## Why This Matters

The copy is no longer hidden. It becomes a named adapter from "whatever range I
was given" to "a stable push-back container I can inspect."

That is a good fit for STL-inspired design: preserve generic input, but make
the cost of needing stronger guarantees visible.

The current rule is deliberately memorable: source ranges are stable values. If
a source range points into the container being mutated, snapshot it before the
mutation begins.
