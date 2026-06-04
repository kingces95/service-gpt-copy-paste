# Generic Forward List Family

Forward list specialization follows the generic container policy: the package
exports the family object, and clients name the object specialization they use.

```js
import {
  ForwardList as ForwardList$,
  ObjectForwardListStorage,
} from '@kingjs/cursor-container'

const ForwardList = ForwardList$.of(Object, ObjectForwardListStorage)
```

The ordinary JS forward list is an object-node list. This is the linked
container analog to `std::forward_list<T>`: the user-facing type is `T`, while
storage supplies node creation and node value access.

## Forward List Storage

Forward-list storage is node storage. The container owns phased sequence
behavior, while the storage traits adapt link creation, link traversal, value
access, and link insertion/erasure.

```txt
Forward List Storage
├─ ForwardListStorageTraits
└─ ObjectForwardListStorage
```

This keeps the storage vocabulary container-specific:

```txt
Container Storage
├─ Vector: contiguous storage
├─ Deque: segmented block storage
└─ ForwardList: singly-linked node storage
```

`List` still uses the forward-list implementation as its temporary base, but
with rewind-link storage so its bidirectional behavior remains explicit until
the list family gets its own storage commit.
