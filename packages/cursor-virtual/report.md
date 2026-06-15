# Cursor Virtual Report

Reports for settling the virtual range API surface used by byte-positioned
scans. Virtual ranges expose logical cursors while still allowing algorithms to
factor the range into lower-space pages and, at the leaves, contiguous spans.

Contents

- [Cursor Partial Type Members](#cursor-partial-type-members): Partial types
  applied to cursor receivers, ordered by dependency.
- [Container Partial Type Members](#container-partial-type-members): Partial
  types applied to container receivers, ordered by dependency.
- [Page Projection](#page-projection): Types that expose virtual page structure.
- [Page Search Algorithms](#page-search-algorithms): Algorithms that consume
  pages before any storage-specific leaf span optimization.

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
├─ PageCursor
│  ├─ sourceCursor$
│  ├─ offset$
│  ├─ isSynchronized()
│  ├─ synchronize()
│  └─ virtualize()
├─ FixedStridePageCursor
│  ├─ isSynchronized()
│  ├─ synchronize()
│  └─ virtualize()
├─ VariableStridePageCursor
│  ├─ isSynchronized()
│  ├─ synchronize()
│  └─ virtualize()
├─ ProjectedCursor
│  └─ sourceCursor$
├─ FixedStrideProjectedCursor
│  └─ stride$
└─ VariableStrideProjectedCursor
   └─ stride$

Private
├─ PageCursor
│  └─ _sourceCursor
├─ ProjectedCursor
│  └─ _sourceCursor
└─ VirtualCursor
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
├─ VirtualContainerPart
│  ├─ pushRange(range)
│  ├─ popRange(cursor)
│  ├─ ranges()
│  └─ pages()
├─ ProjectedRangePart
│  ├─ source$
│  └─ decodeToken$(sourceCursor, stride)
├─ SplitContainerPart
│  └─ split(cursor, result)
└─ CloneEmptyPart
   └─ cloneEmpty()

Shape
└─ VirtualContainerShape
   ├─ pushRange(range)
   ├─ popRange(cursor)
   ├─ ranges()
   └─ pages()

Naked
├─ PageContainer
│  └─ span(begin, end)
├─ RangePageContainer
│  └─ -
├─ VirtualPageContainer
│  └─ -
├─ FixedStridePageContainer
│  └─ -
├─ VariableStridePageContainer
│  └─ -
└─ VariableStrideProjectedRangeContainer
   └─ tokenStrideOf$(value)

Private
├─ PageContainer
│  └─ _range
├─ RangePageContainer
│  ├─ _container
│  ├─ _outerCursor
│  ├─ _innerCursorEnd
│  └─ _virtualEnd
├─ VirtualPageContainer
│  ├─ _virtualBegin
│  └─ _virtualEnd
├─ FixedStridePageContainer
│  ├─ _modulus
│  ├─ _sourcePage
│  └─ _strideLength
├─ VariableStridePageContainer
│  ├─ _isContinuation
│  └─ _sourcePage
├─ FixedStrideProjectedRangeContainer
│  ├─ _remainder
│  └─ _strideLength
├─ ProjectedRangeContainer
│  └─ _source
├─ VirtualContainer
│  ├─ _ranges
│  └─ _tail
└─ VariableStrideProjectedRangeContainer
   ├─ _isContinuation
   └─ _continuationCountOf
```

## Page Projection

```txt
Virtual Page Projection
├─ set: cursor-virtual range and virtual types
├─ map: type, page projection role
├─ pivot: range, virtual, page
└─ display: type roots with projected page leaves
```

```txt
Virtual Page Projection

Range
├─ VirtualContainer
│  ├─ stores pushed ranges as PageContainer instances
│  └─ pages() returns page cursors in VirtualContainer space
└─ VirtualCursor
   ├─ pages(other)
   └─ materialize(other)

Virtual
├─ ProjectedCursor
│  ├─ pages(other)
│  └─ materialize(other)
├─ FixedStrideProjectedCursor
│  └─ pages(other) yields FixedStridePageContainer
└─ VariableStrideProjectedCursor
   └─ pages(other) yields VariableStridePageContainer

Page
├─ PageContainer
├─ RangePageContainer
├─ VirtualPageContainer
├─ FixedStridePageContainer
└─ VariableStridePageContainer
```

## Page Search Algorithms

```txt
Virtual Page Search Algorithms
├─ set: cursor-shape projections and cursor-virtual algorithms
├─ map: algorithm, role, expected surface
├─ pivot: page, leaf span, virtual search
└─ display: algorithm roots with role leaves
```

```txt
Virtual Page Search Algorithms

Page
└─ pages()
   ├─ exposes lower-space page ranges
   └─ maps page offsets back into the caller cursor space

Leaf Span
└─ page.span() / page cursor walking
   ├─ exposes page-local contiguous storage when available
   └─ maps byte offsets back into virtual cursor space

Virtual Search
└─ findSequence(range, sequence)
   ├─ factors virtual ranges into pages before span scans
   ├─ materializes virtual needles into the page value space
   ├─ maps page-local matches back into virtual cursors
   └─ bounds cross-page cursor walking to starts inside the current page
```

```txt
Page Container
├─ begin()
│  └─ page cursor at searchable page begin
└─ end()
   └─ page cursor at searchable page end

Page Cursor
├─ isSynchronized()
│  └─ true when the page cursor is a virtual token boundary
├─ synchronize()
│  └─ page cursor snapped backward to a virtual token boundary
└─ virtualize()
   └─ virtual cursor, or null if unsynchronized
```
