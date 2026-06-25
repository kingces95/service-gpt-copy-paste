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
- [Byte Search Algorithms](#byte-search-algorithms): Algorithms that consume
  byte page records before mapping matches back into virtual cursors.

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
   ├─ _innerCursorEnd
   ├─ _activateInnerCursor
   ├─ _normalizeRangeEnd
   └─ _resetInnerCursor
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
│  ├─ popRange(needle, options)
│  ├─ ranges()
│  ├─ spans()
│  └─ materialize()
├─ SplittableRangePart
│  ├─ splitAt(cursor)
│  └─ split(needle, options)
├─ ProjectedRangePart
│  ├─ source$
│  └─ decodeToken$(sourceCursor)

Shape
├─ RangesContainerShape
│  ├─ pushRange(range)
│  ├─ popRangeAt(cursor)
│  ├─ popRange(needle, options)
│  ├─ ranges()
│  ├─ spans()
│  └─ materialize()
└─ SplittableRangeShape
   ├─ splitAt(cursor)
   └─ split(needle, options)

Naked
└─ VariableStrideProjectedRangeContainer
   └─ tokenStrideOf$(value)

Private
├─ FixedStrideProjectedRangeContainer
│  ├─ _remainder
│  └─ _strideLength
├─ ProjectedRangeContainer
│  └─ _source
├─ VirtualContainer
│  ├─ _pages
│  ├─ _pushStoredRange
│  ├─ _replaceStoredRange
│  ├─ _popRangePrefixAt
│  ├─ _findRange
│  └─ _cursorAt
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
│  ├─ uses deque storage for stream-style front consumption
│  ├─ invalidates cursors after consuming source ranges
│  ├─ materialize() exits into a Uint8Array
│  └─ never decides token synchronization
└─ VirtualCursor
   └─ walks physical ranges as one address space

Projected
├─ ProjectedRangeContainer
│  ├─ has one source range
│  ├─ owns protected source access
│  ├─ decodes source tokens through decodeToken$()
│  └─ exposes projected logical values
├─ ProjectedCursor
│  ├─ holds a source cursor
│  └─ asks the container to decode the current source token
├─ FixedStrideProjectedRangeContainer
│  └─ trims pushed suffixes by tracking fixed-stride remainder
└─ VariableStrideProjectedRangeContainer
   └─ trims pushed suffixes by backing up over continuations
```

## Byte Search Algorithms

```txt
Virtual Byte Search Algorithms
├─ set: cursor-shape projections and cursor-virtual algorithms
├─ map: algorithm, role, expected surface
├─ pivot: virtual byte page, projected search, leaf span
└─ display: algorithm roots with role leaves
```

```txt
Virtual Byte Page
└─ VirtualContainer.popRange(needle)
   ├─ materializes the needle into byte space
   ├─ asks findBytesInSpans for { spanIndex, spanOffset }
   ├─ maps page byte offsets back to virtual cursors
   └─ consumes source ranges through the matched byte sequence

Projected Search
└─ ProjectedRangeContainer.popRange(needle)
   ├─ requires projected needles for projected ranges
   ├─ materializes projected needles into source value space
   ├─ delegates source search to VirtualContainer.popRange(needle)
   ├─ assumes valid encoded needles are self-synchronizing
   └─ maps page matches back into projected cursors

Leaf Span
└─ findBytesInSpans(spans, needle)
   ├─ consumes byte spans yielded by RangeContainerPart.spans()
   ├─ uses native Buffer.indexOf for page-local matches
   ├─ carries a short byte tail for cross-page matches
   └─ returns the page index plus byte offset
```
