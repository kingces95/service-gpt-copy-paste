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
