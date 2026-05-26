# Shape to Probe

## Starting Point

The STL concepts discussion made the old `Shape` name feel overloaded.

The existing `partial-shape` package did not represent the future
STL-shaped structural contract. It represented observational checks over wild
JavaScript values:

```js
value instanceof ThenableShape
```

That test may inspect live properties, trigger getters, trip proxy traps, or
observe values whose shape changes over time. That behavior is useful, but it
is more of a probe than a compile-time-style requirement. In the current
vocabulary, that example would be `value instanceof ThenableProbe`.

## Rename

The first concrete step was mechanical:

```txt
@kingjs/partial-shape -> @kingjs/probe
Shape                  -> Probe
*Shape                 -> *Probe
```

For example:

```js
export class ThenableProbe extends Probe {
  then() { }
}
```

and:

```js
export class PushProbe extends Probe {
  push(value) { }
}
```

This freed the word `Shape` for the stronger abstraction we wanted next: a
transparent, descriptor-bound structural requirement closer to STL named
concepts. That abstraction was later implemented as
[`@kingjs/partial-shape`](./2026-05-20-004-partial-shape-and-satisfy.notes.md).

## Decoupling

After the mechanical rename, `Probe` was decoupled from the partial system:

```js
export class Probe extends Metadata {
  static [Symbol.hasInstance](instance) {
    // observational duck test
  }
}
```

`Probe` no longer extends `PartialType`, imports partial symbols, or uses
`PartialReflect`.

## ProbeReflect

The decoupling exposed a useful policy boundary. Plain ES6 reflection saw
`constructor` and `Object.prototype` members as part of the required probe
surface. That made simple probes accidentally require implementation noise.

The fix was to name the reflection policy:

```js
const ProbeReflect = Es6Reflector.create({
  knownTypes: [ Metadata, Object ],
  knownKeys: [ 'constructor' ],
})
```

So `ProbeReflect` means:

```txt
Reflect the declared probe surface.
Hide Metadata and Object implementation members.
Ignore constructor as probe noise.
```

That kept the implementation aligned with the larger design style: specialize
reflection policy instead of adding ad hoc checks to the probe algorithm.

## Design Split

The vocabulary now has a cleaner path:

```txt
Probe
└─ observational check over wild JavaScript values
└─ may invoke getters or proxy traps
└─ derives from Metadata
└─ uses ProbeReflect

Concept
└─ nominal/public capability
└─ explicitly composed into a type
└─ appears in the meta-prototype chain

Shape
└─ transparent structural requirement
└─ descriptor-bound
└─ cached by tested type
└─ closer to STL named concepts
```

## Links

- [Reframing STL Concepts as Shapes](./2026-05-20-002-stl-concepts-as-shapes.notes.md)
- [Partial shape design](./2026-05-20-003-partial-shape-design.notes.md)
- [Partial Shape and Satisfy](./2026-05-20-004-partial-shape-and-satisfy.notes.md)
