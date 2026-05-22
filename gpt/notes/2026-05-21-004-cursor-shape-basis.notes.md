# Cursor Shape Basis

### Created 2026-05-21

## Summary

Cursor shapes are the STL-ish query vocabulary. Most cursor shapes keep STL
category names because those names carry useful existing associations.

Concepts are the C#-ish declaration/provenance vocabulary. Shapes reuse concept
descriptors with `[Implements]`, but shape satisfaction remains structural and
does not publish nominal concept composition.

```txt
Concepts: where members come from.
Shapes: what algorithms ask for.
Parts: where checked/debug behavior lives.
```

## STL-Basis Shapes

These names have a strong STL basis:

```txt
InputCursorShape
└─ std::input_iterator

OutputCursorShape
└─ std::output_iterator

ForwardCursorShape
└─ std::forward_iterator

BidirectionalCursorShape
└─ std::bidirectional_iterator

RandomAccessCursorShape
└─ std::random_access_iterator

ContiguousCursorShape
└─ std::contiguous_iterator
```

They are not nominal interfaces. They are runtime structural translations of
STL named concepts.

```js
cursor instanceof RandomAccessCursorShape
```

means:

```txt
Does this cursor type structurally satisfy the random-access cursor surface?
```

## Local Writable Shapes

`RandomAccessCursorShape` carries `ReadableAtCursorConcept` because STL random
access already has cheap read-at-offset syntax:

```cpp
*(it + n)
```

The direct KingJS cursor translation would be:

```js
cursor.clone().move(offset).value
```

That is faithful but allocation-heavy and awkward in JavaScript. So
`RandomAccessCursorShape` asks for the optimized local member:

```js
cursor.at(offset)
```

Writing through an offset is also algorithmically real, but it is not needed
only for symmetry. It becomes useful for algorithms such as `sort`, `reverse`,
`rotate`, and `partition`, so it gets a named writable shape:

```txt
WritableRandomAccessCursorShape
├─ includes OutputCursorShape
├─ includes RandomAccessCursorShape
└─ implements WritableAtCursorConcept

WritableContiguousCursorShape
├─ includes ContiguousCursorShape
└─ includes WritableRandomAccessCursorShape
```

## Why Not ReadableAt Shape

The old offset-readable shape name sounded too much like an STL-style
category, and then `ReadableAtCursorShape` turned out to be unnecessary as a
public shape. STL already says random access supports `it[n]`, so the KingJS
translation is that random access supports `at(offset)`.

`WritableRandomAccessCursorShape` is different. STL separates movement strength
from writability, and writable random access is a useful algorithm boundary.

## Shape Includes

These trees are intentionally a little dishonest. They are documentation
views, not exact merge-order expansions of the shape poset. Repeated inherited
branches are collapsed so the design intent is visible at a glance.

```txt
CursorShape
└─ InputCursorShape
   └─ ForwardCursorShape
      └─ BidirectionalCursorShape
         └─ RandomAccessCursorShape
            └─ ContiguousCursorShape

OutputCursorShape
└─ WritableRandomAccessCursorShape
   └─ WritableContiguousCursorShape
```

The more honest poset edges are:

```txt
WritableRandomAccessCursorShape
├─ RandomAccessCursorShape
└─ OutputCursorShape

WritableContiguousCursorShape
├─ ContiguousCursorShape
└─ WritableRandomAccessCursorShape
```

## Shape Implements

This tree is also intentionally compressed. It shows the concepts each shape
introduces at the point where they are most useful to read, not every inherited
concept that will be visible through the full structural walk.

```txt
CursorShape
├─ CursorConcept
└─ SteppableCursorConcept

InputCursorShape
└─ ReadableCursorConcept

OutputCursorShape
└─ WritableCursorConcept

ForwardCursorShape
└─ CloneableCursorConcept

BidirectionalCursorShape
└─ BacktrackableCursorConcept

RandomAccessCursorShape
├─ MovableCursorConcept
├─ ComparableToCursorConcept
├─ MeasurableCursorConcept
└─ ReadableAtCursorConcept

WritableRandomAccessCursorShape
└─ WritableAtCursorConcept

ContiguousCursorShape
└─ SpannableCursorConcept

WritableContiguousCursorShape
```

## Related

- [STL Mechanical Translation](./2026-05-21-001-stl-mechanical-translation.notes.md)
- [Concept Associated Types vs Shape Prototypes](./2026-05-21-002-concept-associated-types-vs-shape-prototypes.notes.md)
- [Transparent Root Copy](./2026-05-21-003-transparent-root-copy.notes.md)
