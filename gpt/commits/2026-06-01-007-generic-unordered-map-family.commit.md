# Generic Unordered Map Family

Unordered map specialization completes the associative generic shape:
`UnorderedMap` is a family object specialized by key type, mapped value type,
and storage policy.

```js
import {
  UnorderedMap as UnorderedMap$,
  ObjectUnorderedMapStorage,
} from '@kingjs/cursor-container'

const UnorderedMap =
  UnorderedMap$.of(Object, Object, ObjectUnorderedMapStorage)
```

The ordinary JS unordered map is a native `Map` over object keys and object
values. This is the closest analog to `std::unordered_map<Key, T>`: the
user-facing type has a key axis and a mapped-value axis, while storage owns
lookup and mutation.

## Unordered Map Storage

Unordered-map storage is key/value associative storage. The container owns the
range and associative surface, while storage traits adapt allocation,
membership, key erasure, lookup, insertion/assignment, clearing, and size.

```txt
Unordered Map Storage
├─ UnorderedMapStorageTraits
└─ ObjectUnorderedMapStorage
```

The associative storage basis now has both key-only and key/value forms:

```txt
Associative Storage
├─ UnorderedSet: key membership
└─ UnorderedMap: key/value lookup and mutation
```

Like unordered-set, the storage currently adapts native JavaScript collections
so iterator cursors still receive real iterable collection objects. Custom hash
or bucket policies can be introduced later without changing the public
container surface.
