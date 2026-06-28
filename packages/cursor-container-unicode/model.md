# Cursor Container Unicode Model

Unicode container pivots for byte streams, code units, and code points.

Contents

- [Byte Unit And Point Extensions](#byte-unit-and-point-extensions):
  Unicode types pivoted by virtual stream role and extension root.
- [Virtual Source Type](#virtual-source-type): Unicode virtual
  containers pivoted by stream role and virtual source type.
- [Activation](#activation): Unicode activator and concrete type selection.
- [Source Span Type](#source-span-type): Unicode generic containers whose
  `TSpan` describes the committed source spans, not the virtual values.

## Byte Unit And Point Extensions

```txt
Unicode Byte Unit And Point Extensions
├─ set: cursor-virtual and cursor-container-unicode types
├─ map: extensions*, byte/unit/point
├─ filter: unicode package types
├─ pivot: byte/unit/point, then type
└─ display: type roots with direct extensions as leaves
```

```txt
Unicode Byte Unit And Point Extensions

Byte
└─ ProjectedRangeContainer
   └─ ByteOrderedContainer

Unit
└─ ByteOrderedContainer
   ├─ Utf16CodeUnitContainer
   │  ├─ Utf16BECodeUnitContainer
   │  └─ Utf16LECodeUnitContainer
   └─ Utf32CodeUnitContainer
      ├─ Utf32BECodeUnitContainer
      └─ Utf32LECodeUnitContainer

Point
├─ ProjectedRangeContainer
│  ├─ Utf8CodePointContainer
│  └─ Utf16CodePointContainer
│     ├─ Utf16BECodePointContainer
│     └─ Utf16LECodePointContainer
└─ ProjectedRangeContainer
   └─ Utf32CodePointContainer
      ├─ Utf32BECodePointContainer
      └─ Utf32LECodePointContainer
```

## Virtual Source Type

```txt
Unicode Virtual Source Type
├─ set: cursor-container-unicode types
├─ map: virtual source type, byte/unit/point
├─ filter: types extending ProjectedRangeContainer
├─ pivot: byte/unit/point, then virtual source type
└─ display: virtual source roots with virtual containers as leaves
```

```txt
Unicode Virtual Source Type

Byte
└─ VirtualContainer
   └─ ByteOrderedContainer

Unit
└─ ByteOrderedContainer
   ├─ Utf16CodeUnitContainer
   ├─ Utf16BECodeUnitContainer
   ├─ Utf16LECodeUnitContainer
   ├─ Utf32CodeUnitContainer
   ├─ Utf32BECodeUnitContainer
   └─ Utf32LECodeUnitContainer

Point
├─ VirtualContainer
│  └─ Utf8CodePointContainer
├─ Utf16CodeUnitContainer
│  ├─ Utf16CodePointContainer
│  ├─ Utf16BECodePointContainer
│  └─ Utf16LECodePointContainer
└─ Utf32CodeUnitContainer
   ├─ Utf32CodePointContainer
   ├─ Utf32BECodePointContainer
   └─ Utf32LECodePointContainer
```

## Activation

```txt
Unicode Activation
├─ set: Unicode activator and concrete code point containers
├─ map: preamble/default key, activated container type
├─ pivot: signature, byte order mark, default
└─ display: activation keys with concrete code point container leaves
```

```txt
Unicode Activation

Signature
└─ utf8
   └─ Utf8CodePointContainer

Byte Order Mark
├─ utf16be
│  └─ Utf16BECodePointContainer
├─ utf16le
│  └─ Utf16LECodePointContainer
├─ utf32be
│  └─ Utf32BECodePointContainer
└─ utf32le
   └─ Utf32LECodePointContainer

Default
├─ supplied defaultEncoding
│  └─ used only after all known preambles are ruled out
└─ requirePreamble
   └─ rejects streams with no known preamble
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
