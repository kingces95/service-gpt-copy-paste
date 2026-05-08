# Default Constructible Container

Make "new it, then push into it" a promise instead of a hope.

Library functions often accept a `Type` parameter because callers should choose
the result container. The hidden requirement is that the type can be created
and filled.

## The JavaScript Idiom

The function assumes `Type` has the right shape.

```js
function collect(values, Type = Array) {
  const result = new Type()

  for (const value of values)
    result.push(value)

  return result
}
```

If `Type` cannot be constructed or does not have `push`, the error happens
halfway through the implementation.

## Declarative Translation

Name the two requirements as checks.

```js
const collect = contract({
  [Defaults]: [null, Array],
  [Preconditions]: [
    null,
    [DefaultConstructible, PushBackContainer],
  ],
}, function collect(values, Type) {
  const result = new Type()

  for (const value of values)
    result.push(value)

  return result
})
```

The happy path is unchanged:

```js
const values = collect(range, VectorMap)
```

The failure path is now about the public contract, not a surprise `push` error.

## Why This Matters

This generalizes a common nagging problem in JavaScript libraries: accepting a
constructor is flexible, but the real constructor contract is usually implicit.

Once the contract is metadata, docs can say what kind of `Type` is accepted and
the loader can reject bad types before the algorithm starts doing work.
