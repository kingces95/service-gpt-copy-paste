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
