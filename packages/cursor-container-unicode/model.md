# Cursor Container Unicode Model

Unicode container pivots for byte streams, code units, and code points.

Contents

- [Type Extensions](#type-extensions): Unicode container types pivoted by
  byte/unit/point role and extension root.
- [Part Composition](#part-composition): Unicode container types pivoted by
  component part.
- [Virtual Source Type](#virtual-source-type): Unicode projected containers
  pivoted by stream role and source type.
- [Activation](#activation): Unicode activator and concrete type selection.

## Type Extensions

```txt
Unicode Type Extensions
├─ set: cursor-container-unicode container types
├─ map: extensions*, byte/unit/point
├─ pivot: byte/unit/point, then type
└─ display: type roots with direct extensions as leaves
```

```txt
Unicode Type Extensions

Byte
└─ ProjectedRangeContainer
   └─ CodeUnitContainer

Unit
└─ CodeUnitContainer
   ├─ Utf16BECodeUnitContainer
   ├─ Utf16LECodeUnitContainer
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

## Part Composition

```txt
Unicode Part Composition
├─ set: cursor-container-unicode container types
├─ map: directly composed parts, byte/unit/point
├─ pivot: part, then byte/unit/point
└─ display: part roots with composing container leaves
```

```txt
Unicode Part Composition

ByteOrderedPart
└─ Unit
   └─ CodeUnitContainer

StringMaterializationPart
└─ Point
   ├─ Utf8CodePointContainer
   ├─ Utf16CodePointContainer
   └─ Utf32CodePointContainer

ProjectedRangeContainerPart
└─ Point
   ├─ Utf8CodePointContainer
   ├─ Utf16CodePointContainer
   └─ Utf32CodePointContainer
```

## Virtual Source Type

```txt
Unicode Virtual Source Type
├─ set: cursor-container-unicode projected containers
├─ map: virtual source type, byte/unit/point
├─ pivot: byte/unit/point, then virtual source type
└─ display: virtual source roots with projected container leaves
```

```txt
Unicode Virtual Source Type

Unit
└─ VirtualContainer
   ├─ Utf16BECodeUnitContainer
   ├─ Utf16LECodeUnitContainer
   ├─ Utf32BECodeUnitContainer
   └─ Utf32LECodeUnitContainer

Point
├─ VirtualContainer
│  └─ Utf8CodePointContainer
├─ Utf16BECodeUnitContainer
│  └─ Utf16BECodePointContainer
├─ Utf16LECodeUnitContainer
│  └─ Utf16LECodePointContainer
├─ Utf32BECodeUnitContainer
│  └─ Utf32BECodePointContainer
└─ Utf32LECodeUnitContainer
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
