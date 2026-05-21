# STL-Shaped Requirements

## Impetus

While inspecting range declarations, `OutputRangeConcept` and
`RandomAccessRangeConcept` appeared side by side on containers such as `Deque`.
That led to the larger realization that names like `ForwardCursorConcept` and
`ForwardRangeConcept` are not faithful STL mappings when they are modeled as
nominal concepts in the meta-prototype chain.

In STL, `std::forward_iterator<I>` and `std::ranges::forward_range<R>` are
named structural predicates, not interfaces that appear in a runtime hierarchy.

## Desired Exploration

Explore a split between:

```txt
Concept
└─ nominal/public capability

Shape
└─ structural, descriptor-bound, cached requirement

Probe
└─ lightweight runtime observation over wild objects
```

The likely direction is to rename/demote current `partial-shape` checks to
`Probe`, move them out of partial, and reserve `Shape` for transparent
Concept-like requirements that use loader descriptor bindings without becoming
part of nominal type identity.

## Concrete Win

When complete, STL-shaped names like `ForwardCursorShape` or
`RandomAccessRangeShape` could be used as structural checks without forcing
those names into the composed prototype chain.

That should make range/cursor declarations clearer and help separate movement
category from read/write access.

## Progress

- The old observational `Shape` abstraction has been renamed to `Probe`.
- `@kingjs/partial-shape` has been moved to `@kingjs/probe`.
- `Probe` now derives from `Metadata`, not `PartialType`.
- `ProbeReflect` owns the reflection policy for observational matching.

Remaining work:

- Reclaim `Shape` for transparent structural requirements.
- Decide which cursor/range `Concept` names should become structural shapes.
- Revisit range movement/access declarations after the vocabulary settles.

## Proposed Names

- `Includes`: shape adjacency symbol for composing one shape from other shapes.
- `satisfy(type, shape)`: procedural API for attaching structural satisfaction.

## Settled Policy

- `satisfy` takes one constructor type and one shape.
- `satisfy` is the procedural declaration; `instanceof Shape` is the query.
- `Includes` includes only other shapes.
- Shape checks are strict descriptor checks over constructor types.
- Shape satisfaction caches positive and negative results.
- Shape copies descriptors like `Concept`, without default helper members.
- Probe remains the value-level runtime observation abstraction.
- Shape remains the STL-ish type-level probing abstraction.

The detailed sketch is in
[Partial shape design](../notes/2026-05-20-partial-shape-design.md).

Update: `satisfy` moved to `@kingjs/partial-satisfy` and now mirrors
`implement` by copying Shape descriptors onto a type. Shape is transparent
outside its own family, so those descriptors flatten into normal types without
publishing Shape as nominal composition.

The checkin note is
[Partial Shape and Satisfy](../notes/2026-05-20-partial-shape-and-satisfy.md).
