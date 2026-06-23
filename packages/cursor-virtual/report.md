# Cursor Virtual Report

Reports for settling the virtual and projected range API surfaces used by
byte-positioned scans. Virtual containers compose address spaces from pages;
projected containers trim pushed suffixes and decode source positions into
logical values.

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
├─ RangeContainerPart
│  ├─ pushRange(range)
│  ├─ popRangeAt(cursor)
│  ├─ popRange(sequence, options)
│  ├─ ranges()
│  └─ materialize()
├─ SplittableRangePart
│  ├─ splitAt(cursor)
│  └─ split(sequence, options)
├─ ProjectedRangePart
│  ├─ source$
│  ├─ projector$
│  └─ decodeToken$(sourceCursor, stride)

Shape
├─ RangesContainerShape
│  ├─ pushRange(range)
│  ├─ popRangeAt(cursor)
│  ├─ popRange(sequence, options)
│  ├─ ranges()
│  └─ materialize()
└─ SplittableRangeShape
   ├─ splitAt(cursor)
   └─ split(sequence, options)

Naked
├─ Page
│  ├─ range
│  ├─ begin()
│  ├─ end()
│  ├─ span(begin, end)
│  └─ findSequence(needle)
├─ Projector
│  └─ projectValue(sourceCursor, stride)
└─ VariableStrideProjectedRangeContainer
   └─ tokenStrideOf$(value)

Private
├─ Page
│  ├─ _range
│  ├─ _container
│  ├─ _outerCursor
│  ├─ _virtualizeCursor
│  └─ _virtualizeMatch
├─ Projector
│  └─ _container
├─ FixedStrideProjectedRangeContainer
│  ├─ _remainder
│  └─ _strideLength
├─ ProjectedRangeContainer
│  ├─ _projector
│  └─ _source
├─ VirtualContainer
│  ├─ _pages
│  └─ _pageTail
└─ VariableStrideProjectedRangeContainer
   ├─ _isContinuation
   └─ _continuationCountOf
```

## Virtual And Projected Model

```txt
Virtual And Projected Model
├─ set: cursor-virtual range and projected types
├─ map: type, role, mapper count, suffix policy
├─ pivot: virtual, projected
└─ display: type roots with role leaves
```

```txt
Virtual
├─ VirtualContainer
│  ├─ stores pushed physical ranges
│  ├─ exposes one logical address space
│  ├─ materialize() exits into a Uint8Array
│  └─ never decides token synchronization
├─ VirtualCursor
│  └─ walks physical ranges as one address space
└─ Page
   ├─ has-a physical range
   └─ maps page-local matches to virtual cursors when attached

Projected
├─ ProjectedRangeContainer
│  ├─ has one source range
│  ├─ has one projector
│  └─ exposes projected logical values
├─ ProjectedCursor
│  ├─ holds a source cursor
│  └─ asks the container to decode the current source token
├─ FixedStrideProjectedRangeContainer
│  └─ trims pushed suffixes by tracking fixed-stride remainder
└─ VariableStrideProjectedRangeContainer
   └─ trims pushed suffixes by backing up over continuations
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
└─ VirtualContainer.popRange(sequence)
   ├─ searches private Page descriptors
   ├─ receives virtual cursors from page matches
   └─ consumes source ranges through the matched sequence

Projected Search
└─ findSequence(range, sequence)
   ├─ requires projected needles for projected ranges
   ├─ materializes projected needles into source value space
   ├─ searches source pages
   ├─ assumes valid encoded needles are self-synchronizing
   └─ maps page matches back into projected cursors

Leaf Span
└─ Page.findSequence(needle)
   ├─ uses private page-local contiguous storage when available
   └─ returns virtual cursors when attached to a VirtualContainer
```
