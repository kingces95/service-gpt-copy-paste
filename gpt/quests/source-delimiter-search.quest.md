# Source Delimiter Search

Quest:

Find delimiters by searching the source representation directly, then use the
resulting source cursor to split higher-level projected containers.

Impetus:

Scanning projected code points is a useful correctness model, but it is a lot
of machinery for common delimiters such as newline. For `read`-style workflows,
the hot operation is often "find the next delimiter" and the delimiter can be
compiled into the source encoding:

```txt
\n
├─ UTF-8     -> 0A
├─ UTF-16LE -> 0A 00
├─ UTF-16BE -> 00 0A
├─ UTF-32LE -> 0A 00 00 00
└─ UTF-32BE -> 00 00 00 0A
```

That means the framework can keep its projected cursor model for reasoning
while allowing a low-level search path for the common case.

Model:

```txt
delimiter search
├─ compile delimiter code point
│  ├─ source pattern
│  ├─ unit width
│  └─ alignment base
├─ search source spans
│  ├─ Buffer.indexOf(pattern)
│  └─ cross-span fallback window
├─ reject unaligned matches
└─ return source cursor
```

The caller can then split at the projected layer:

```txt
source cursor
└─ projected cursor
   └─ projected.split(cursor)
```

Policy:

```txt
source delimiter search
├─ only searches delimiters that can be represented as fixed source patterns
├─ checks alignment for multi-byte encodings
├─ does not decode unrelated code points
├─ returns a cursor/offset in source space
└─ preserves projected scanning as the correctness baseline
```

UTF-8 newline is trivial because the delimiter is one byte and cannot be a
continuation byte. UTF-16 and UTF-32 need alignment, not surrogate-state
tracking, for ASCII delimiters such as newline. Surrogate validation remains a
decode concern, not a delimiter-search concern.

Candidate API:

```js
const findLineFeed = sourceFind.of({
  pattern: Uint8Array.of(0x0a, 0x00),
  width: 2,
  alignmentBase: 0,
})

const sourceCursor = findLineFeed(source)
```

For UTF-8:

```js
const findLineFeed = sourceFind.of({
  pattern: Uint8Array.of(0x0a),
  width: 1,
})
```

Node-backed fast path:

```txt
byte span
├─ Buffer.from(span.buffer, span.byteOffset, span.byteLength)
│  └─ view, not a byte copy
└─ buffer.indexOf(pattern, offset)
```

Cross-span matching can use a small carry buffer of `pattern.length - 1` bytes.
Most searches should hit inside a single source span, so the fallback should
stay narrow and obvious.

Open questions:

```txt
result
├─ source cursor
├─ source byte offset
└─ both, with offset used for alignment and cursor used for split
```

```txt
home
├─ cursor-container-ranges algorithm
├─ cursor-container-unicode source-search helper
└─ cursor-algorithm once source spans become a general shape
```

```txt
delimiter vocabulary
├─ compile code point to source pattern
├─ compile string to source pattern
└─ accept precompiled pattern only
```

Preference:

Start with precompiled byte patterns and alignment. That proves the optimization
can live inside the framework without forcing byte-order or delimiter grammar
policy into the generic range code. Once the shape is pretty, add Unicode
delimiter compilers on top.
