# Cursor Container Ranges Report

Reports for settling the range-container API surface before adding optimized
sequence scans that pierce through ranges-of-ranges to byte storage.

Contents

- [Cursor Partial Type Members](#cursor-partial-type-members): Partial types
  applied to cursor receivers, ordered by dependency.
- [Container Partial Type Members](#container-partial-type-members): Partial
  types applied to container receivers, ordered by dependency.
- [Generic Span Type](#generic-span-type): Range types whose generic
  specialization carries the homogeneous span type used by `spans()`.
- [Span Projection Algorithms](#span-projection-algorithms): Algorithms that
  consume the span projection before any storage-specific optimization.

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

## Generic Span Type

```txt
Range Generic Span Type
├─ set: cursor-container-ranges generic types
├─ map: generic specializer, standard alias, spanType role
├─ pivot: declaration, container
└─ display: generic roots with standard aliases as leaves
```

```txt
Range Generic Span Type

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
Range Span Projection Algorithms
├─ set: cursor-shape projections and cursor-container-ranges algorithms
├─ map: algorithm, role, expected surface
├─ pivot: projection, assertion
└─ display: algorithm roots with role leaves
```

```txt
Range Span Projection Algorithms

Projection
└─ spansOfRange(range)
   ├─ uses range.spans() descriptors
   └─ falls back to range.span() as one descriptor

Assertion
└─ RangeOfRangesPart.spans()
   └─ asserts each descriptor span is an instance of spanType
```
