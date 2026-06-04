# Generic Vector Family

Generic container families expose specialization, not an implicit default type.
The package exports the family object, and clients choose local names for the
specializations they use:

```js
import {
  Vector as Vector$,
  Uint8VectorStorage,
} from '@kingjs/cursor-container'

const Vector = Vector$.of(Number, Uint8VectorStorage)
```

This keeps the package surface focused on families while allowing each client
or test matrix to decide whether a specialization should be called `Vector`,
`Uint8Vector`, `VectorOfNumberUint8`, or something else.

## Generic Specialization

Specialization is factored through `specializer`:

```txt
Specializer
├─ specializer(...)
│  └─ contract-checked specialization function
└─ specializer.loader(...)
   └─ cached type specialization by type tuple
```

Method-like specializers can expose a callable default specialization with an
`.of` escape hatch. Class-like generic families expose only `{ of }`, so using
the family itself as a constructor fails loudly instead of smuggling in a hidden
default specialization.

## Vector Storage

Vector storage is container-specific vocabulary. Since all containers share one
package namespace, vector storage names carry the container name:

```txt
Vector Storage
├─ VectorStorageTraits
├─ Int8VectorStorage
├─ Uint8VectorStorage
├─ Uint8ClampedVectorStorage
├─ Int16VectorStorage
├─ Uint16VectorStorage
├─ Int32VectorStorage
├─ Uint32VectorStorage
├─ Float32VectorStorage
├─ Float64VectorStorage
├─ BigInt64VectorStorage
├─ BigUint64VectorStorage
└─ BitVectorStorage
```

`Vector.of(TValue, TStorage)` validates that the storage value type matches the
requested value type, then uses `VectorStorageTraits` to adapt allocation,
capacity, indexing, span exposure, default value, and byte width.

## Contract Metadata

Function contracts now have a precondition axis in addition to argument type
checks and defaults:

```txt
Contract
├─ defaults
├─ type checks
├─ preconditions
└─ receiver
```

Preconditions use metadata normalization: a single function and a list of
functions are both accepted, and every normalized entry must be callable.
