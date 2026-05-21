# Reframing STL Concepts as Shapes

## Starting Point

This thread started while looking at range declarations like:

```js
export class Deque extends PartialProxy {
  static cursorType = IndexableCursor
  static {
    implement(this, OutputRangeConcept)
    implement(this, RandomAccessRangeConcept, {
      begin() { return new this.cursorType(this, 0) },
      end() { return new this.cursorType(this, this.size) },
    })
  }
}
```

The declaration felt odd because `OutputRangeConcept` is bolted next to
`RandomAccessRangeConcept`. That raised the larger question: did the cursor and
range concepts actually follow the STL model?

## Basis

STL has named concepts such as:

```cpp
std::forward_iterator<I>
std::ranges::forward_range<R>
std::ranges::random_access_range<R>
```

But these are not interfaces or base classes that user types inherit from.
They are compile-time structural predicates. A type satisfies them when the
compiler can prove the required expressions, associated types, and iterator
categories line up.

In other words:

```txt
STL named concept
└─ named structural requirement
   └─ checked by compiler machinery
      └─ does not appear in the runtime/prototype/object hierarchy
```

## Mismatch

The current `Concept` system is more nominal and C#-ish:

```js
implement(this, ForwardCursorConcept)
cursor instanceof ForwardCursorConcept
```

That means `ForwardCursorConcept` appears in the composed meta-prototype story.
This is useful for opt-in public contracts, but it is not the faithful STL
mapping.

The STL-shaped model would be closer to a transparent structural requirement:

```txt
ForwardCursorShape
└─ owns required descriptor bindings
└─ checks whether a type satisfies them
└─ caches positive and negative results
└─ does not become part of nominal type identity
```

## Naming Pressure

`Probe` sounds like an ad hoc runtime observation:

```txt
Probe
└─ ask a question about a wild object
└─ no strong implication of descriptor binding or caching
```

But the STL-shaped thing is stronger:

```txt
Shape
└─ named structural contract
└─ descriptor-bound using loader/reflection machinery
└─ cached by tested type
└─ usable through instanceof
└─ transparent, not nominal
```

That split is now sharper:

```txt
Probe
└─ asks about a live object

Shape
└─ asks about a constructor type
```

The constructor-type rule is what makes Shape cacheable in the STL-ish way.
It does not observe runtime object state. It checks descriptors.

That suggested the old observational `partial-shape` naming was backwards:

```txt
Old observational shape
└─ became Probe
   └─ demoted out of partial
      └─ works on wild objects

New Shape
└─ transparent structural requirement
   └─ structural and cached
      └─ closer to STL named concepts
```

## Design Split

The emerging vocabulary:

```txt
Concept
└─ nominal/public capability
└─ explicitly composed into a type
└─ appears in the meta-prototype chain

Shape
└─ structural requirement
└─ transparent
└─ descriptor-bound
└─ cached by type
└─ STL named concept analog

Probe
└─ ad hoc runtime observation
└─ works on wild objects
└─ lightweight and general
```

## Quest

Create a quest to reconcile cursor and range abstractions with this split:

1. Audit `*CursorConcept` and `*RangeConcept` for STL-shaped names that are
   actually being modeled as nominal concepts.
2. Decide which names should remain `Concept` because they are intentionally
   C#-ish/public/nominal.
3. Introduce a structural `Shape` abstraction for STL-like requirements.
4. Rename/demote current `partial-shape` style checks to `Probe` and move them
   to a more general package if they operate on wild objects.
5. Revisit range concepts such as `ForwardRangeConcept` and
   `OutputRangeConcept`, especially where movement and access are still mixed.

## Original Impetus

The specific smell was this realization:

```txt
ForwardIteratorConcept does not match the STL basis.
It appears in the prototype chain.
STL forward_iterator is a named structural predicate instead.
```

That mismatch is the root reason to explore demoting/renaming the current
`Shape` machinery and introducing a stronger, transparent structural contract.

## Next Note

The concrete `Shape` design is sketched in
[Partial shape design](./2026-05-20-003-partial-shape-design.notes.md). That note records
the emerging names:

```txt
Includes
└─ shape adjacency symbol

satisfy(type, shape)
└─ procedural declaration that a type satisfies a shape
```

The settled policy is: `satisfy` accepts constructor types only, `Includes`
accepts shapes only, satisfaction is strict descriptor checking, `satisfy`
mirrors `implement`, and `instanceof Shape` is the query surface.

The implemented package split is summarized in
[Partial Shape and Satisfy](./2026-05-20-004-partial-shape-and-satisfy.notes.md).
