# Shape Observation

Sometimes the chain is strict, but the value is wild.

`Shape` uses strict ES6 declarations to describe a desired surface, then tests
wild JavaScript values observationally. This is adjacent to the
meta-prototype-chain spine because it reuses `PartialReflect` duck-casting
queries, but acknowledges that external values are not certified types.

## Source

- `packages/partial-shape/shape.js`
- `packages/partial-shape/shapes.test.js`
- `packages/partial-shape/unit.test.js`

## The Pain

JavaScript structural checks often become ad hoc probes.

```js
if (!value || typeof value.then != 'function')
  throw new TypeError('Expected thenable.')
```

That check is useful but local, and it does not document the intended shape.

## The Transform

A `Shape` declaration is strict metadata:

```js
class ThenableShape extends Shape {
  then() { }
}
```

But matching is observational:

```txt
Shape declaration:

ThenableShape
└─ then method requirement

Candidate value:

value
└─ observed property `then`

Runtime probe:

value instanceof ThenableShape
└─ true if observed `then` is callable
```

```js
value instanceof ThenableShape
```

The test may read properties, invoke getters, trigger proxy traps, or observe
dynamic state. The source calls this an "observational structural probe."

## What It Describes

This transform describes the boundary between certified concepts and wild JS
objects.

```txt
Concept matching = certified and non-observational
Shape matching   = permissive and observational
```

## Marketing Hook

This is duck typing with a label. You still accept the messy JavaScript world,
but the expected shape becomes reusable documentation instead of another
inline `typeof` check.

## Lineage

The lineage is TypeScript structural typing, but moved to runtime observation.

```ts
type Thenable = { then: Function }
```

The JavaScript translation can test actual values at runtime:

```js
value instanceof ThenableShape
```
