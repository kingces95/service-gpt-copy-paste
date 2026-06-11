# Cursor Virtual Report

Reports for settling the virtual range API surface used by byte-positioned
scans. Virtual ranges expose logical cursors while still allowing algorithms to
factor the range into lower-space pages and, at the leaves, contiguous spans.

Contents

- [Cursor Partial Type Members](#cursor-partial-type-members): Partial types
  applied to cursor receivers, ordered by dependency.
- [Container Partial Type Members](#container-partial-type-members): Partial
  types applied to container receivers, ordered by dependency.
- [Generic Span Type](#generic-span-type): Cursor types whose generic
  specialization carries the homogeneous span type used by `spans()`.
- [Span Projection Algorithms](#span-projection-algorithms): Algorithms that
  consume the span projection before any storage-specific optimization.

## Cursor Partial Type Members

```txt
Virtual Cursor Partial Type Members
├─ set: partial types applied to cursor receivers
├─ map: surface owner, partial type, members
├─ chip pivot: concept, part, shape, naked, private
├─ pivot: dependency order within each chip
└─ display: surface roots with member leaves
```

```txt
Virtual Cursor Partial Type Members

Concept
├─ EquatableConcept
│  └─ equals(other)
└─ BacktrackableCursorConcept
   └─ stepBack()

Part
├─ CursorPart
│  └─ isAtEnd$
├─ SteppableCursorPart
│  └─ step()
├─ BacktrackableCursorPart
│  ├─ isAtBegin$()
│  └─ stepBack()
├─ ReadableCursorPart
│  └─ value
├─ CloneableCursorPart
│  └─ clone()
└─ VirtualCursorPart
   ├─ pages(other)
   └─ materialize(other)

Shape
└─ -

Naked
├─ ProjectedRangeCursor
│  └─ sourceCursor$
├─ FixedStrideRangeCursor
│  └─ stride$
└─ VariableStrideRangeCursor
   └─ stride$

Private
├─ ProjectedRangeCursor
│  └─ _sourceCursor
└─ RangeContainerCursor
   ├─ _outerCursor
   ├─ _innerCursor
   └─ _innerCursorEnd
```

## Container Partial Type Members

```txt
Virtual Container Partial Type Members
├─ set: partial types applied to container receivers
├─ map: surface owner, partial type, members
├─ chip pivot: concept, part, shape, naked, private
├─ pivot: dependency order within each chip
└─ display: surface roots with member leaves
```

```txt
Virtual Container Partial Type Members

Concept
├─ RangeConcept
│  ├─ begin()
│  └─ end()
└─ EquatableConcept
   └─ equals(other)

Part
├─ ContainerPart
│  └─ isEmpty
├─ RangeOfRangesPart
│  ├─ pushRange(range)
│  ├─ popRange(cursor)
│  ├─ ranges()
│  ├─ pages()
│  └─ spans()
├─ ProjectedRangePart
│  ├─ source$
│  └─ decodeToken$(sourceCursor, stride)
├─ TrimmedRangePart
│  └─ sourceEnd$
├─ SplitContainerPart
│  └─ split(cursor, result)
└─ CloneEmptyPart
   └─ cloneEmpty()

Shape
└─ RangeOfRangesShape
   ├─ pushRange(range)
   ├─ popRange(cursor)
   ├─ ranges()
   └─ spans()

Naked
└─ VariableStrideRangeContainer
   └─ tokenStrideOf$(value)

Private
├─ FixedStrideRangeContainer
│  ├─ _remainder
│  └─ _strideLength
├─ ProjectedRangeContainer
│  └─ _source
├─ RangeContainer
│  ├─ _ranges
│  └─ _tail
└─ VariableStrideRangeContainer
   ├─ _isContinuation
   └─ _continuationCountOf
```

## Generic Span Type

```txt
Virtual Generic Span Type
├─ set: cursor-virtual and cursor-container generic types
├─ map: generic specializer, standard alias, spanType owner
├─ pivot: cursor, declaration, container
└─ display: generic roots with standard aliases as leaves
```

```txt
Virtual Generic Span Type

Cursor
├─ ContiguousCursorOf(TSpan)
│  └─ ContiguousCursor = ContiguousCursorOf(Object)
├─ ProjectedRangeCursorOf(TSpan)
│  └─ ProjectedRangeCursor = ProjectedRangeCursorOf(Object)
├─ FixedStrideRangeCursorOf(TSpan)
│  └─ FixedStrideRangeCursor = FixedStrideRangeCursorOf(Object)
├─ VariableStrideRangeCursorOf(TSpan)
│  └─ VariableStrideRangeCursor = VariableStrideRangeCursorOf(Object)
└─ RangeContainerCursorOf(TSpan)
   └─ RangeContainerCursor = RangeContainerCursorOf(Object)

Declaration
├─ RangeOfRangesPartOf(TSpan)
│  └─ RangeOfRangesPart = RangeOfRangesPartOf(Object)
└─ RangeOfRangesShapeOf(TSpan)
   └─ RangeOfRangesShape = RangeOfRangesShapeOf(Object)

Container
├─ RangeContainerOf(TSpan)
│  └─ RangeContainer = RangeContainerOf(Object)
├─ ProjectedRangeContainerOf(TSpan)
│  └─ ProjectedRangeContainer = ProjectedRangeContainerOf(Object)
├─ FixedStrideRangeContainerOf(TSpan)
│  └─ FixedStrideRangeContainer = FixedStrideRangeContainerOf(Object)
└─ VariableStrideRangeContainerOf(TSpan)
   └─ VariableStrideRangeContainer = VariableStrideRangeContainerOf(Object)
```

## Span Projection Algorithms

```txt
Virtual Span Projection Algorithms
├─ set: cursor-shape projections and cursor-virtual algorithms
├─ map: algorithm, role, expected surface
├─ pivot: projection, assertion
└─ display: algorithm roots with role leaves
```

```txt
Virtual Span Projection Algorithms

Projection
└─ spansOfRange(range)
   ├─ uses range.spans() descriptors
   └─ falls back to range.span() as one descriptor

Assertion
└─ RangeOfRangesPart.spans()
   └─ asserts each descriptor span is an instance of spanType

Virtual Search
└─ findSequence(range, sequence)
   ├─ factors virtual ranges into pages before span scans
   ├─ materializes virtual needles into the page value space
   └─ falls back to cursor walking for cross-page matches
```
