# Probe Observation

Sometimes the chain is strict, but the value is wild.

The old observational `Shape` role moved to `Probe`. A `Probe` uses strict ES6
declarations to describe a desired surface, then tests wild JavaScript values
observationally.

## Source

- `packages/probe/probe.js`
- `packages/probe/probes.js`
- `packages/probe/probes.test.js`

## The Pain

JavaScript structural checks often become ad hoc probes.

```js
if (!value || typeof value.then != 'function')
  throw new TypeError('Expected thenable.')
```

That check is useful but local, and it does not document the intended surface.

## The Transform

A `Probe` declaration is reusable metadata:

```js
class ThenableProbe extends Probe {
  then() { }
}
```

Matching is observational:

```txt
Probe declaration:

ThenableProbe
└─ then method requirement

Candidate value:

value
└─ observed property `then`

Runtime probe:

value instanceof ThenableProbe
└─ true if observed `then` is callable
```

The test may read properties, invoke getters, trigger proxy traps, or observe
dynamic state.

## What It Describes

This transform describes the boundary between certified concepts, structural
shapes, and wild JS objects.

```txt
Concept matching = nominal and certified
Shape matching   = structural and type-level
Probe matching   = permissive and observational
```

## Related

- [Shape to Probe](../../notes/2026-05-20-001-shape-to-probe.notes.md)
- [Partial Shape and Satisfy](../../notes/2026-05-20-004-partial-shape-and-satisfy.notes.md)
