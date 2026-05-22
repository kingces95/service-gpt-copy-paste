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
- The range category concept ladder has been deleted. `RangeConcept` remains
  as the direct nominal range declaration, while `RangeShape` and the
  STL-ish range probes live in `@kingjs/cursor-shape`.
- Cursor parts now declare both channels: `Implements` still names the current
  nominal cursor concept, while `Includes` names the structural cursor shape
  the part depends on. This is an additive bridge toward deleting the cursor
  category concept ladder without losing each part's implicit contract.
- The cursor category concept ladder has now been deleted. `InputCursorShape`,
  `ForwardCursorShape`, `RandomAccessCursorShape`, and the other cursor shapes
  are the category vocabulary. `CursorConcept` remains only as the base nominal
  helper that publishes `equatableTo`, `range`, and `step` while concrete
  cursor definitions satisfy shapes for their richer capabilities.
- The cursor shape ladder now uses `Includes` rather than inheritance to encode
  STL-style implication. The STL names remain because their associations are
  valuable; the mechanism is structural composition.
- Implementation sites can smear aggregate capabilities. For example,
  mutable cursors satisfy `InputCursorShape` and `OutputCursorShape` directly,
  while an aggregate mutable cursor shape is deferred until a real algorithm
  asks for it.
- The old observational `@kingjs/partial-shape` role moved to `@kingjs/probe`;
  the package name `@kingjs/partial-shape` was then reclaimed for structural
  type-level shapes.
- `Probe` now derives from `Metadata`, not `PartialType`.
- `ProbeReflect` owns the reflection policy for observational matching.
- The standalone `partial-satisfy` verb was retired. `Shape[Symbol.hasInstance]`
  now performs the cached structural descriptor query directly.

Remaining work:

- Finish any remaining migration from legacy cursor/range vocabulary to the
  concept/shape split.
- Sweep package metadata and older notes that still refer to retired package
  boundaries.

## Proposed Names

- `Includes`: shape adjacency symbol for composing one shape from other shapes.
- `instance instanceof Shape`: query surface for structural satisfaction.

## Settled Policy

- `Includes` includes only other shapes.
- Shape checks are strict descriptor checks over constructor types.
- Shape satisfaction caches positive and negative results.
- Shape copies descriptors like `Concept`, without default helper members.
- Probe remains the value-level runtime observation abstraction.
- Shape remains the STL-ish type-level probing abstraction.
- Use `Includes` to express shape implication, even for familiar STL ladders.
- Use aggregate shapes for queries, but let concrete definitions satisfy
  smaller facets when that better documents the implementation.
- Cursor/range concepts live in `@kingjs/cursor`; cursor and range shapes live
  in `@kingjs/cursor-shape`; concrete containers and views import both as
  needed.

The detailed sketch is in
[Partial shape design](../notes/2026-05-20-003-partial-shape-design.notes.md).

Update: the `partial-satisfy` experiment was retired. Shape satisfaction now
stays in `@kingjs/partial-shape` as strict structural descriptor matching.

The checkin note is
[Partial Shape and Satisfy](../notes/2026-05-20-004-partial-shape-and-satisfy.notes.md).
