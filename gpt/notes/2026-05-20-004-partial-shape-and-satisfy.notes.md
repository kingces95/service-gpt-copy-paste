# Partial Shape and Satisfy

## Summary

This checkin introduces `@kingjs/partial-shape` as the STL-ish structural
sibling of `Concept`. It also introduced an experimental procedural verb that
mirrored `implement`; that separate package has since been removed.

The design split is now:

```txt
Concept
└─ nominal/public capability
└─ copied into a type
└─ published into the normal meta-prototype chain
└─ cached because composition is fixed after type construction

Shape
└─ structural/type-level requirement
└─ transparent outside its own family
└─ queried structurally with instanceof
└─ cached because descriptor structure is fixed after type construction

Probe
└─ runtime/value-level observation
└─ works on wild objects
└─ not cached because it inspects live objects, not prototypes
```

Concept and Shape both rely on structure discoverable after type construction,
which is analogous to the post-compilation world STL concepts inhabit. Probe
stays uncached because it observes object state and runtime traps directly.

## Motivation

This follows from the earlier rename captured in
[Shape to Probe](./2026-05-20-001-shape-to-probe.notes.md) and the design sketch in
[Partial Shape Design](./2026-05-20-003-partial-shape-design.notes.md).

The cursor/range names inherited from STL, such as `ForwardCursorConcept` and
`RandomAccessRangeConcept`, are not really nominal interfaces in STL. They are
structural predicates checked by compiler machinery.

In JavaScript, `Shape` becomes the runtime-reflective translation of that idea:

```txt
STL named concept
└─ compile-time structural predicate

Shape
└─ descriptor-bound structural requirement over constructor types
```

`Probe` remains the looser wild-object check. `Concept` remains the C#-ish
nominal/public contract.

## Loader Change

`Shape` forced a refinement of `Transparent`.

```txt
transparent same family
└─ adjoins as a real node

transparent different family
└─ flattens into the host descriptor surface
```

This lets Shapes compose with other Shapes:

```txt
DerivedShape
└─ BaseShape
```

while satisfying a normal type does not publish the Shape into that type's
nominal chain:

```txt
MyType
└─ no Shape node
```

## New Packages

### `@kingjs/partial-shape`

Adds `Shape extends PartialType`.

```js
export class Shape extends PartialType {
  static [Transparent] = true

  static [Adjacent] = {
    [Defines]: Attachments,
    [Includes]: Shape,
  }

  static [Compile](descriptor) {
    descriptor = super[Compile](descriptor)
    return abstractify(descriptor)
  }

  static [Symbol.hasInstance](instance) {
    // structural descriptor query
  }
}
```

### Retired Copy Verb

Retired after this checkin. Shape matching now lives in `@kingjs/partial-shape`
as a strict structural descriptor query:

```js
value instanceof SomeShape
```

## Supporting Changes

`linearize` now accepts either a root or a forest:

```js
linearize(root, adjacent, options)
linearize([rootA, rootB], adjacent, options)
```

`PartialType` now owns family predicates used by the loader:

```js
PartialType.isUserDefined(type)
PartialType.getFamily(type)
PartialType.isSameFamily(left, right)
```

`WeakMapLookup` now reads as:

```js
cache.of(...keys)
```

`Shape` uses it to cache both positive and negative structural matches:

```js
const matchesOfShape = matches.of(shape)
```

## Testing

`partial-shape` owns the branch-coverage harness for `Shape` itself.

Focused coverage for `packages/partial-shape/index.js` is 100% for statements,
branches, functions, and lines.
