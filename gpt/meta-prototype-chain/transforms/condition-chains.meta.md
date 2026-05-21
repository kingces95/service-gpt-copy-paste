# Condition Chains

Guards should compose like the members they protect.

Preconditions and postconditions are metadata first. The condition-chain
transform expands those metadata POJOs into member-keyed chains that can wrap
methods, getters, and setters.

## Source

- `packages/partial-metadata/index.js`
- `packages/partial-proxy/index.js`
- `packages/partial-extend/thunk.test.js`

## The Pain

Guard clauses are usually scattered inside method bodies.

```js
step() {
  if (this.equals(this.range.end()))
    throwMoveOutOfBounds()

  return this.move(1)
}
```

Once concepts and partial classes enter the picture, guards need inheritance
and composition too.

## The Transform

Condition metadata starts as static POJOs:

```js
static [Preconditions] = {
  step() { throwIfEnd(this) },
  get value() { throwIfEnd(this) },
}
```

`partialReflectOnMetaObject(symbol)` maps the metadata chain into a new chain
whose links are the descriptors inside each metadata POJO:

```txt
Source metadata chain:

MyCursor ([Preconditions])
└─ InputCursorConcept ([Preconditions])
   └─ CursorConcept ([Preconditions])

Transformed condition chain:

MyCursor (step)
└─ InputCursorConcept (value, step)
   └─ CursorConcept (value)
```

`getConditions(type, key)` then gathers the relevant functions for a member.
`PartialProxy` uses `CreateThunk` to wrap concrete descriptors with those
conditions.

```js
getConditions(MyCursor, 'step')
```

## What It Describes

This transform says: "method contracts are inherited metadata, not repeated
boilerplate."

The test in `partial-extend/thunk.test.js` demonstrates the call order:

```txt
type precondition
member precondition
member body
member postcondition
type postcondition
```

## Marketing Hook

This is design-by-contract made composable. A concept can bring the guard, a
class can bring the implementation, and the thunk sees both.

## Lineage

The lineage is design by contract plus C# custom attributes. The project keeps
the contract beside the declaration, then uses runtime transformation to apply
it at the call site.
