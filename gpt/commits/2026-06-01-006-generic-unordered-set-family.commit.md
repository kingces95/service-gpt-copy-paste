# Generic Unordered Set Family

Unordered set specialization introduces the key-only associative generic shape.
`UnorderedSet` is a family object, and clients choose the concrete key/storage
specialization they use.

```js
import {
  UnorderedSet as UnorderedSet$,
  ObjectUnorderedSetStorage,
} from '@kingjs/cursor-container'

const UnorderedSet = UnorderedSet$.of(Object, ObjectUnorderedSetStorage)
```

The ordinary JS unordered set is a native `Set` over object keys. This is the
closest analog to `std::unordered_set<Key>`: the user-facing type is the key,
and storage owns membership.

## Unordered Set Storage

Unordered-set storage is key membership storage. The container owns the range
and associative surface, while storage traits adapt allocation, membership,
insertion, erasure, clearing, and size.

```txt
Unordered Set Storage
├─ UnorderedSetStorageTraits
└─ ObjectUnorderedSetStorage
```

The associative storage basis starts with the key-only case:

```txt
Associative Storage
└─ UnorderedSet: key membership
```

The storage currently adapts native `Set` so iterator cursors still receive a
real JavaScript iterable set. A future hash/bucket storage policy can grow from
this seam when there is a concrete need for it.
