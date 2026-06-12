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
├─ VirtualCursor
│  └─ sourceCursor$
├─ FixedStrideVirtualCursor
│  └─ stride$
└─ VariableStrideVirtualCursor
   └─ stride$

Private
├─ VirtualCursor
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
├─ VirtualPart
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
└─ VariableStrideVirtualContainer
   └─ tokenStrideOf$(value)

Private
├─ FixedStrideVirtualContainer
│  ├─ _remainder
│  └─ _strideLength
├─ VirtualContainer
│  └─ _source
├─ RangeContainer
│  ├─ _ranges
│  └─ _tail
└─ VariableStrideVirtualContainer
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
├─ VirtualCursorOf(TSpan)
│  └─ VirtualCursor = VirtualCursorOf(Object)
├─ FixedStrideVirtualCursorOf(TSpan)
│  └─ FixedStrideVirtualCursor = FixedStrideVirtualCursorOf(Object)
├─ VariableStrideVirtualCursorOf(TSpan)
│  └─ VariableStrideVirtualCursor = VariableStrideVirtualCursorOf(Object)
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
├─ VirtualContainerOf(TSpan)
│  └─ VirtualContainer = VirtualContainerOf(Object)
├─ FixedStrideVirtualContainerOf(TSpan)
│  └─ FixedStrideVirtualContainer = FixedStrideVirtualContainerOf(Object)
└─ VariableStrideVirtualContainerOf(TSpan)
   └─ VariableStrideVirtualContainer = VariableStrideVirtualContainerOf(Object)
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
   ├─ maps page-local matches back into virtual cursors
   └─ bounds cross-page cursor walking to starts inside the current page
```

```txt
Page Descriptor
├─ begin
│  └─ lower cursor at searchable page begin
├─ end
│  └─ lower cursor at searchable page end
├─ isSynchronized(offset)
│  └─ true when the lower offset is a virtual token boundary
├─ virtualize(offset)
│  └─ lower offset -> virtual cursor, or null if unsynchronized
└─ cursorAt(offset)
   └─ compatibility alias for virtualize(offset)
```
