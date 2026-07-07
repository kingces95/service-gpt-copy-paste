# Cursor Container Unicode Model

Unicode-aware read support for byte streams.

Contents

- [Batch Read Flow](#batch-read-flow): How stream bytes become committed
  records.
- [Preamble Scan](#preamble-scan): How the stream encoding is discovered.

## Batch Read Flow

```txt
Unicode-Aware Batch Read Flow
├─ set: byte stream chunks
├─ map: preamble, encoding, delimiter bytes, committed bytes
├─ pivot: scanner, virtual container, unicode helpers
└─ display: runtime flow
```

```txt
Stream Chunks
├─ PreambleScanner
│  ├─ resolves encoding metadata
│  └─ returns a VirtualContainer containing data bytes
├─ UnicodeEncoding.from(encoding).encodeString(delimiter)
│  └─ lowers the delimiter into a Uint8Array needle
├─ VirtualContainer.popRange(needle)
│  ├─ searches byte spans
│  ├─ ignores incomplete trailing byte sequences naturally
│  └─ commits exact byte ranges
└─ UnicodeEncoding.from(encoding).decodeChunks(committed.spans())
   └─ decodes committed byte spans after a delimiter is found
```

## Preamble Scan

```txt
Unicode Preamble Scan
├─ set: supported leading Unicode signatures
├─ map: preamble bytes to encoding metadata
├─ pivot: signature, byte order mark, default
└─ display: metadata returned to the read layer
```

```txt
Signature
└─ EF BB BF
   └─ utf-8

Byte Order Mark
├─ FE FF
│  └─ utf-16be
└─ FF FE
   └─ utf-16le

Default
└─ no matching preamble
   └─ utf-8
```
