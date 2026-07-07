# Cursor Container Unicode Policy

## Preamble Metadata

Unicode-aware read support treats leading Unicode signatures and byte order
marks as stream metadata. The scanner buffers pushed byte ranges until a
known preamble matches or all known preambles are ruled out. It consumes the
matched preamble and returns a `VirtualContainer` containing the undecorated
data.

```txt
known preambles
├─ UTF-8:    EF BB BF
├─ UTF-16BE: FE FF
└─ UTF-16LE: FF FE
```

```txt
scan result
├─ preamble matched
│  ├─ key: matched encoding
│  └─ data: bytes after the preamble
└─ no preamble once decidable
   ├─ key: default encoding, normally utf-8
   └─ data: all buffered bytes
```

## Read Flow

The read layer lowers its delimiter to source bytes using the resolved
encoding, then asks `VirtualContainer` to search those bytes. This keeps
storage and cursor accounting byte-native.

```txt
read flow
├─ resolve encoding metadata from preamble/default
├─ UnicodeEncoding.from(encoding).encodeString(delimiter) -> Uint8Array
├─ VirtualContainer.popRange(needle)
└─ UnicodeEncoding.from(encoding).decodeChunks(committed.spans())
```

UTF-32 preambles and string decoding are intentionally out of scope for now
because Node does not provide the same direct decoding support for UTF-32.
