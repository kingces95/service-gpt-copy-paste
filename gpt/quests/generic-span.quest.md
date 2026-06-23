# Generic Span

Quest:

Move generic typed-array policy from containers to span construction and
contiguous cursor exposure.

Impetus:

The Unicode and virtual-container work needs byte spans, not a fully generic
container hierarchy. Making `Vector` generic in value/storage spreads the
generic policy across containers when the useful runtime invariant is narrower:
the physical contiguous exposure is a `Uint8Array`.

Model:

```js
const byteSpan = span.of(Uint8Array)

const range = byteSpan([1, 2, 3])
```

or:

```js
const ByteSpan = Span.of(Uint8Array)
const range = ByteSpan.of([1, 2, 3])
```

The generic axis belongs to the contiguous exposure:

```txt
container
└─ logical sequence behavior

span
└─ physical contiguous representation
   ├─ Uint8Array
   ├─ Float64Array
   └─ ...
```

Policy:

```txt
span()
├─ returns the typed-array exposure selected by the span constructor
├─ defaults to Uint8Array for byte-stream ranges
├─ is the source of truth for native byte search and decoding
└─ does not require every logical container to become generic
```

Virtual and Unicode containers can assume their pushed ranges are byte spans
once their boundary constructors produce that shape. Byte assertions in the hot
path become construction-time policy rather than repeated operational checks.

Proof:

The Unicode read-emulation client can push byte spans, scan projected code
points, split exact byte ranges, and decode committed bytes without generic
container churn.
