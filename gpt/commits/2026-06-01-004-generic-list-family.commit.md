# Generic List Family

List specialization follows the generic container policy: `List` is a family
object, and clients choose the local name for a specialization.

```js
import {
  List as List$,
  ObjectListStorage,
} from '@kingjs/cursor-container'

const List = List$.of(Object, ObjectListStorage)
```

The ordinary JS list is an object-node list. This is the closest analog to
`std::list<T>`: the container owns bidirectional sequence behavior, while
storage supplies doubly-linked nodes and value access.

## List Storage

List storage extends the linked-node vocabulary introduced by forward-list.
Forward-list storage supplies singly-linked operations; list storage adds
previous-link access plus insertion and erasure at a cursor.

```txt
List Storage
├─ ListStorageTraits
└─ ObjectListStorage
```

The linked container storage basis now has two tiers:

```txt
Linked Storage
├─ ForwardList: create, next, value, insertAfter, eraseAfter
└─ List: previous, insertBefore, erase
```

`List.of(TValue, TStorage)` specializes its forward-list base with the same
storage type, then layers bidirectional cursor behavior and size tracking on
top of that base.
