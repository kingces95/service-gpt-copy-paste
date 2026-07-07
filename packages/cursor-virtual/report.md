# Cursor Virtual Report

Reports for the virtual byte range API used by byte-positioned scans.

Contents

- [Cursor Partial Type Members](#cursor-partial-type-members): Partial types
  applied to cursor receivers, ordered by dependency.
- [Container Partial Type Members](#container-partial-type-members): Partial
  types applied to container receivers, ordered by dependency.
- [Byte Search Algorithms](#byte-search-algorithms): Algorithms that consume
  byte spans and return byte positions.

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
└─ <none>

Private
└─ VirtualCursor
   ├─ _pageCursor
   ├─ _rangeCursor
   ├─ _range
   ├─ _activateRangeCursor
   ├─ _normalizeRangeEnd
   └─ _resetRangeCursor
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
│  ├─ cursorType
│  ├─ begin()
│  └─ end()
└─ EquatableConcept
   └─ equals(other)

Part
├─ ContainerPart
│  └─ isEmpty
└─ RangeContainerPart
   ├─ bytesPushed
   ├─ bytesPopped
   ├─ pushRange(range)
   ├─ popRangeAt(cursor)
   ├─ popRange(needle)
   ├─ ranges()
   ├─ spans()
   ├─ materialize()
   ├─ splitAt(cursor)
   └─ split(needle)

Shape
└─ -

Naked
└─ <none>

Private
└─ VirtualContainer
   ├─ _bytesPopped
   ├─ _bytesPushed
   ├─ _pages
   └─ _pushStoredRange
```

## Byte Search Algorithms

```txt
Virtual Byte Search Algorithms
├─ set: cursor-virtual algorithms
├─ map: algorithm, role, expected surface
├─ pivot: container search, leaf span
└─ display: algorithm roots with role leaves
```

```txt
Container Search
└─ VirtualContainer.popRange(needle)
   ├─ accepts a Uint8Array byte needle
   ├─ asks findBytesInSpans for { spanIndex, spanOffset }
   ├─ maps span byte offsets back to virtual cursors
   └─ consumes source ranges through the matched byte sequence

Leaf Span
└─ findBytesInSpans(spans, needle)
   ├─ consumes byte spans yielded by RangeContainerPart.spans()
   ├─ uses native Buffer.indexOf for span-local matches
   ├─ carries a short byte tail for cross-span matches
   └─ returns the span index plus byte offset
```
