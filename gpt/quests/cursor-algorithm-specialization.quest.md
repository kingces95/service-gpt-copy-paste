# Cursor Algorithm Specialization

Quest:

Let cursor algorithms be specialized once for a known cursor or range type, then
reused on hot paths without rediscovering the same shape every call.

Impetus:

`ProjectedRangeContainer` advances source cursors while walking encoded data:

```js
advance(next, stride)
```

That call is deliberately generic. It can advance any cursor shape that satisfies
the algorithm contract. Inside projection code, though, the source cursor type is
often known and stable. The projection should be able to cache the fastest
algorithm path for that cursor type.

Model:

```txt
cursor algorithm
├─ dynamic form
│  └─ advance(cursor, count)
└─ specialized form
   └─ advance.of(CursorType)(cursor, count)
```

Policy:

```txt
algorithm specialization
├─ accepts a cursor/range/container type
├─ resolves the fastest applicable implementation once
├─ returns a plain callable
├─ preserves the dynamic algorithm as the default surface
└─ caches only where type identity matters
```

The dynamic form remains the ergonomic entry point. The specialized form is a
performance hook for code that already knows the type it will repeatedly touch.

Example:

```js
const advanceSourceCursor = advance.of(SourceCursor)

advanceSourceCursor(next, stride)
```

Candidate implementation:

```txt
advance.of(CursorType)
├─ if CursorType satisfies RandomAccessCursorShape
│  └─ return indexed implementation
├─ if CursorType satisfies BidirectionalCursorShape
│  └─ return bidirectional stepping implementation
├─ if CursorType satisfies ForwardCursorShape
│  └─ return forward stepping implementation
└─ reject unsupported cursor type
```

This should probably mirror generic type specialization without forcing all
algorithm callsites to become generic declarations. A small algorithm-specializer
helper may be enough.

Open questions:

```txt
specialization cache
├─ per algorithm?
├─ shared helper keyed by type tuple?
└─ no cache until identity pressure appears?
```

```txt
shape test timing
├─ eager: fail during advance.of(CursorType)
└─ lazy: fail when specialized function first runs
```

Preference:

Specialize eagerly. If a caller asks for `advance.of(CursorType)`, then the type
should already satisfy the algorithm's supported cursor shapes. Eager failure
makes the cached callable honest.
