# Cursor Virtual Report

Reports for settling the virtual and projected range API surfaces used by
byte-positioned scans. Virtual containers compose address spaces from pages;
projected containers decode synchronized source positions into logical values.

Contents

- [Cursor Partial Type Members](#cursor-partial-type-members): Partial types
  applied to cursor receivers, ordered by dependency.
- [Container Partial Type Members](#container-partial-type-members): Partial
  types applied to container receivers, ordered by dependency.
- [Virtual And Projected Model](#virtual-and-projected-model): The split
  between address composition and value projection.
- [Page Search Algorithms](#page-search-algorithms): Algorithms that consume
  virtual pages before any storage-specific leaf span optimization.

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
└─ CloneableCursorPart
   └─ clone()

Shape
└─ -

Naked
├─ ProjectedCursor
│  └─ sourceCursor$
├─ FixedStrideProjectedCursor
│  └─ stride$
└─ VariableStrideProjectedCursor
   └─ stride$

Private
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
│  └─ ranges()
├─ ProjectedRangePart
│  ├─ source$
│  ├─ projector$
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
   ├─ pages()
   └─ materialize()

Naked
├─ Page
│  ├─ offset
│  ├─ range
│  ├─ cursorType
│  ├─ spanType
│  ├─ begin()
│  ├─ end()
│  ├─ span(begin, end)
│  ├─ offsetOf(cursor)
│  └─ virtualize(cursor)
├─ Projector
│  ├─ isSynchronized(page, sourceCursor)
│  ├─ synchronize(page, sourceCursor)
│  ├─ projectCursor(page, sourceCursor)
│  └─ projectValue(sourceCursor, stride)
├─ VirtualContainer
│  ├─ pages(begin, end)
│  └─ materialize(begin, end)
├─ ProjectedRangeContainer
│  ├─ pages(begin, end)
│  └─ materialize(begin, end)
└─ VariableStrideProjectedRangeContainer
   └─ tokenStrideOf$(value)

Private
├─ Page
│  ├─ _offset
│  ├─ _range
│  └─ _virtualize
├─ Projector
│  └─ _container
├─ FixedStrideProjector
│  └─ _strideLength
├─ VariableStrideProjector
│  └─ _isContinuation
├─ FixedStrideProjectedRangeContainer
│  ├─ _projector
│  ├─ _remainder
│  └─ _strideLength
├─ ProjectedRangeContainer
│  ├─ _projector
│  └─ _source
├─ VirtualContainer
│  ├─ _ranges
│  └─ _tail
└─ VariableStrideProjectedRangeContainer
   ├─ _projector
   ├─ _isContinuation
   └─ _continuationCountOf
```

## Virtual And Projected Model

```txt
Virtual And Projected Model
├─ set: cursor-virtual range and projected types
├─ map: type, role, mapper count, synchronization policy
├─ pivot: virtual, projected
└─ display: type roots with role leaves
```

```txt
Virtual
├─ VirtualContainer
│  ├─ stores pushed physical ranges
│  ├─ exposes one logical address space
│  ├─ pages() yields Page descriptors
│  ├─ materialize() returns another VirtualContainer
│  └─ never decides token synchronization
├─ VirtualCursor
│  └─ walks physical ranges as one address space
└─ Page
   ├─ has-a physical range
   ├─ carries address metadata like offset
   └─ virtualize(cursor) maps page space to virtual space

Projected
├─ ProjectedRangeContainer
│  ├─ has one source range
│  ├─ has one projector
│  └─ exposes projected logical values
├─ ProjectedCursor
│  ├─ holds a source cursor
│  └─ asks the container to decode the current source token
├─ FixedStrideProjector
│  └─ synchronizes page positions using fixed stride and page offset
└─ VariableStrideProjector
   └─ synchronizes page positions by backing up over continuations
```

## Page Search Algorithms

```txt
Virtual Page Search Algorithms
├─ set: cursor-shape projections and cursor-virtual algorithms
├─ map: algorithm, role, expected surface
├─ pivot: virtual page, projected search, leaf span
└─ display: algorithm roots with role leaves
```

```txt
Virtual Page
└─ pages()
   ├─ exposes lower-space page ranges
   └─ maps page cursors back into virtual cursor space

Projected Search
└─ findSequence(range, sequence)
   ├─ requires projected needles for projected ranges
   ├─ materializes projected needles into source value space
   ├─ searches source pages
   ├─ asks projector if page-space matches are synchronized
   └─ maps synchronized page matches back into projected cursors

Leaf Span
└─ page.span()
   ├─ exposes page-local contiguous storage when available
   └─ maps byte offsets through page.virtualize(cursor)
```
