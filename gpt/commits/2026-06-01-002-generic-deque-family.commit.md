# Generic Deque Family

Deque specialization follows the same generic family policy as vector:
`Deque` is a family object, and clients name the specializations they use.

```js
import {
  Deque as Deque$,
  ObjectDequeStorage,
} from '@kingjs/cursor-container'

const Deque = Deque$.of(Object, ObjectDequeStorage)
```

The ordinary JS deque is an object deque. This is the closest analog to
`std::deque<T>`: values are user-facing objects or references, while the
container manages segmented storage behind the surface.

## Deque Storage

Deque storage is block storage. The container owns sequence behavior, while the
storage traits adapt block allocation, element access, default value, and block
capacity.

```txt
Deque Storage
├─ DequeStorageTraits
├─ ObjectDequeStorage
├─ Int8DequeStorage
├─ Uint8DequeStorage
├─ Uint8ClampedDequeStorage
├─ Int16DequeStorage
├─ Uint16DequeStorage
├─ Int32DequeStorage
├─ Uint32DequeStorage
├─ Float32DequeStorage
├─ Float64DequeStorage
├─ BigInt64DequeStorage
└─ BigUint64DequeStorage
```

Object storage is the baseline specialization. Typed storage is the compact
numeric specialization. Both use the same deque surface: front insertion, back
insertion, indexed access, range insertion, range erasure, resizing, and bulk
assignment.

## Segmented Sequence

The deque implementation is now a segmented sequence over storage-provided
blocks. It can grow at either end by moving the logical start offset instead of
requiring contiguous reallocation.

```txt
Deque
├─ start offset
├─ size
├─ block map
└─ storage traits
   ├─ allocate block
   ├─ read slot
   ├─ write slot
   └─ default value
```

This keeps the STL-inspired shape: vector is contiguous storage, deque is
segmented storage, and later list storage can give a home to node allocation.
