# Cursor Container Unicode Model

Unicode container pivots for byte streams, code units, and code points.

Contents

- [Byte Unit And Point Extensions](#byte-unit-and-point-extensions):
  Unicode types pivoted by projected stream role and extension root.
- [Projected Source Type](#projected-source-type): Unicode projected
  containers pivoted by stream role and projected source type.
- [Byte Order Part Composition](#byte-order-part-composition):
  Unicode types chip-pivoted by byte-order part composition.

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

## Byte Order Part Composition

```txt
Unicode Byte Order Part Composition
├─ set: cursor-container-unicode types
├─ map: composed directly or indirectly with byte-order part
├─ chip pivot: ByteOrderedPart, ByteOrderAwarePart, Remainder
└─ display: chip roots with type leaves
```

```txt
Unicode Byte Order Part Composition

ByteOrderedPart
└─ ByteOrderedContainer

ByteOrderAwarePart
├─ CodeUnitContainer
├─ Utf16CodeUnitContainer
├─ Utf32CodeUnitContainer
├─ Utf16CodePointContainer
└─ Utf32CodePointContainer

Remainder
└─ Utf8CodePointContainer
```
