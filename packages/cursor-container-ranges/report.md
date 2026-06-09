# Cursor Container Ranges Report

Reports for settling the range-container API surface before adding optimized
sequence scans that pierce through ranges-of-ranges to byte storage.

Contents

- [Cursor Partial Type Members](#cursor-partial-type-members): Partial types
  applied to cursor receivers, ordered by dependency.
- [Container Partial Type Members](#container-partial-type-members): Partial
  types applied to container receivers, ordered by dependency.

## Cursor Partial Type Members

```txt
Range Cursor Partial Type Members
├─ set: partial types applied to cursor receivers
├─ map: surface owner, partial type, members
├─ chip pivot: concept, part, shape, naked, private
├─ pivot: dependency order within each chip
└─ display: surface roots with member leaves
```

```txt
Range Cursor Partial Type Members

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
Range Container Partial Type Members
├─ set: partial types applied to container receivers
├─ map: surface owner, partial type, members
├─ chip pivot: concept, part, shape, naked, private
├─ pivot: dependency order within each chip
└─ display: surface roots with member leaves
```

```txt
Range Container Partial Type Members

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
