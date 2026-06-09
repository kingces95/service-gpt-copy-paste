# Cursor Container Unicode Model

Unicode container pivots for byte streams, code units, and code points.

Contents

- [Byte Unit And Point Extensions](#byte-unit-and-point-extensions):
  Unicode types pivoted by projected stream role and extension root.
- [Projected Source Type](#projected-source-type): Unicode projected
  containers pivoted by stream role and projected source type.
- [Source Span Type](#source-span-type): Unicode generic containers whose
  `TSpan` describes the committed source spans, not the projected values.

## Byte Unit And Point Extensions

```txt
Unicode Byte Unit And Point Extensions
├─ set: cursor-container-ranges and cursor-container-unicode types
├─ map: extensions*, byte/unit/point
├─ filter: unicode package types
├─ pivot: byte/unit/point, then type
└─ display: type roots with direct extensions as leaves
```

```txt
Unicode Byte Unit And Point Extensions

Byte
└─ FixedStrideRangeContainer
   └─ ByteOrderedContainer

Unit
├─ FixedStrideRangeContainer
│  └─ CodeUnitContainer
└─ CodeUnitContainer
   ├─ Utf16CodeUnitContainer
   └─ Utf32CodeUnitContainer

Point
├─ VariableStrideRangeContainer
│  ├─ Utf8CodePointContainer
│  └─ Utf16CodePointContainer
└─ FixedStrideRangeContainer
   └─ Utf32CodePointContainer
```

## Projected Source Type

```txt
Unicode Projected Source Type
├─ set: cursor-container-unicode types
├─ map: projected source type, byte/unit/point
├─ filter: types extending ProjectedRangeContainer
├─ pivot: byte/unit/point, then projected source type
└─ display: projected source roots with projecting containers as leaves
```

```txt
Unicode Projected Source Type

Byte
└─ RangeContainer
   └─ ByteOrderedContainer

Unit
└─ ByteOrderedContainer
   ├─ CodeUnitContainer
   ├─ Utf16CodeUnitContainer
   └─ Utf32CodeUnitContainer

Point
├─ RangeContainer
│  └─ Utf8CodePointContainer
├─ Utf16CodeUnitContainer
│  └─ Utf16CodePointContainer
└─ Utf32CodeUnitContainer
   └─ Utf32CodePointContainer
```

## Source Span Type

```txt
Unicode Source Span Type
├─ set: cursor-container-unicode generic containers
├─ map: generic specializer, byte/unit/point
├─ pivot: byte/unit/point, then generic root
└─ display: generic roots with standard aliases as leaves
```

```txt
Unicode Source Span Type

Byte
└─ ByteOrderedContainerOf(TSpan)
   └─ ByteOrderedContainer = ByteOrderedContainerOf(Object)

Unit
├─ CodeUnitContainerOf(TSpan)
│  └─ CodeUnitContainer = CodeUnitContainerOf(Object)
├─ Utf16CodeUnitContainerOf(TSpan)
│  └─ Utf16CodeUnitContainer = Utf16CodeUnitContainerOf(Object)
└─ Utf32CodeUnitContainerOf(TSpan)
   └─ Utf32CodeUnitContainer = Utf32CodeUnitContainerOf(Object)

Point
├─ Utf8CodePointContainerOf(TSpan)
│  └─ Utf8CodePointContainer = Utf8CodePointContainerOf(Object)
├─ Utf16CodePointContainerOf(TSpan)
│  └─ Utf16CodePointContainer = Utf16CodePointContainerOf(Object)
└─ Utf32CodePointContainerOf(TSpan)
   └─ Utf32CodePointContainer = Utf32CodePointContainerOf(Object)
```
