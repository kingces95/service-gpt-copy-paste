# Cursor Container Unicode Policy

## Byte Order Mark

UTF code unit containers may normalize an optional stream prefix before code
units are exposed. A byte order mark is treated as stream metadata, not as a
virtual value. The byte stream stays hidden until enough source bytes have
been pushed to match a known preamble or rule all known preambles out.

The byte ordered layer accepts either a resolved byte order or a preamble map:

```txt
byteOrder
├─ big | little
│  └─ already resolved; do not inspect or consume leading bytes
├─ null
│  └─ use native byte order immediately
└─ { big, little }
   └─ scan for an optional preamble before exposing bytes
```

```txt
optional preamble map
├─ matching big/little preamble: consume preamble and use matched order
├─ no preamble once decidable: use native byte order
└─ insufficient bytes: expose no units yet
```

## Unicode Activation

`UnicodeActivator` treats leading Unicode signatures and byte order marks as
type-selection metadata. It buffers pushed byte ranges until a known preamble
matches or all known preambles are ruled out, then activates a concrete code
point container and replays the undecorated remainder into it.

```txt
known preambles
├─ UTF-32BE: 00 00 FE FF
├─ UTF-32LE: FF FE 00 00
├─ UTF-8:    EF BB BF
├─ UTF-16BE: FE FF
└─ UTF-16LE: FF FE
```

Longer preambles are considered before shorter overlapping preambles, so
`FF FE` remains pending until `UTF-32LE` can be ruled out.

```txt
activation
├─ preamble matched: consume preamble and activate matching concrete type
├─ no preamble and defaultEncoding: activate the default concrete type
├─ no preamble and requirePreamble: reject
└─ activated: forward later pushed ranges to the concrete container
```
