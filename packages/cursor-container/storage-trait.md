# Vector Array Model

Vector is generic in a typed-array constructor. The typed-array constructor is
the lowest allocation primitive JavaScript exposes for local contiguous numeric
storage, so Vector owns the storage algorithms and uses the array constructor
directly. Logical value type is derived from the typed-array family.

Contents

- [Vector Generic Parameters](#vector-generic-parameters): Vector type arguments pivoted by role.
- [Typed Array Constructors](#typed-array-constructors): accepted array constructors pivoted by logical value type.
- [Vector Array Surface](#vector-array-surface): Vector operations pivoted by typed-array surface.
- [Excluded Representations](#excluded-representations): representations that need a different abstraction.

## Vector Generic Parameters

Vector type arguments pivoted by role.

```txt
Vector Generic Parameters
├─ set: VectorOf type arguments
├─ transform: argument -> (role, argument)
├─ pivot: role
└─ display: argument leaves under role roots
```

```txt
Vector Generic Parameters
└─ Local Contiguous Storage
   └─ TArray
```

## Typed Array Constructors

Accepted array constructors pivoted by logical value type.

```txt
Typed Array Constructors
├─ set: typed-array constructors
├─ transform: constructor -> (value type, constructor)
├─ pivot: value type
└─ display: constructor leaves under value type roots
```

```txt
Typed Array Constructors
├─ Number
│  ├─ Int8Array
│  ├─ Uint8Array
│  ├─ Uint8ClampedArray
│  ├─ Int16Array
│  ├─ Uint16Array
│  ├─ Int32Array
│  ├─ Uint32Array
│  ├─ Float32Array
│  └─ Float64Array
└─ BigInt
   ├─ BigInt64Array
   └─ BigUint64Array
```

## Vector Array Surface

Vector operations pivoted by typed-array surface.

```txt
Vector Array Surface
├─ set: Vector storage operations
├─ transform: operation -> (typed-array member, operation)
├─ pivot: typed-array member
└─ display: operation leaves under typed-array member roots
```

```txt
Vector Array Surface
├─ constructor
│  └─ allocate(capacity) ~ new TArray(capacity)
├─ length
│  └─ capacity ~ storage.length
├─ []
│  ├─ at(index) ~ storage[index]
│  └─ setAt(index, value) ~ storage[index] = value
├─ subarray
│  └─ span(begin, end) ~ storage.subarray(begin, end)
└─ BYTES_PER_ELEMENT
   └─ bytesPerValue ~ TArray.BYTES_PER_ELEMENT
```

## Excluded Representations

Representations that need a different abstraction.

```txt
Excluded Representations
├─ set: non-typed-array representations
├─ transform: representation -> (reason, representation)
├─ pivot: reason
└─ display: representation leaves under reason roots
```

```txt
Excluded Representations
├─ Encoded Byte View
│  └─ Node Buffer endian-aware reads and writes
├─ Packed Logical Values
│  └─ BitVector packed boolean storage
└─ Object Segmented Storage
   └─ Deque object blocks
```
