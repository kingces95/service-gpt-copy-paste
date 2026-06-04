# Generic Array Map Family

Array map specialization follows the generic container policy: `ArrayMap` is a
family object, and clients choose the concrete object-array specialization they
use.

```js
import {
  ArrayMap as ArrayMap$,
  ObjectArrayMapStorage,
} from '@kingjs/cursor-container'

const ArrayMap = ArrayMap$.of(Object, ObjectArrayMapStorage)
```

Despite its name, array map is sequence storage: indexed access over an array
with gap editing. Its generic axis is therefore a value type and a storage
policy, not a key/value associative pair.

## Array Map Storage

Array-map storage is gap-editable indexed storage. The container owns the
cursor/range surface, while storage traits adapt allocation, indexed read/write,
gap opening, gap closing, and range insertion.

```txt
Array Map Storage
├─ ArrayMapStorageTraits
└─ ObjectArrayMapStorage
```

The sequence storage basis now has four shapes:

```txt
Sequence Storage
├─ Vector: contiguous storage
├─ Deque: segmented block storage
├─ ForwardList: singly-linked node storage
├─ List: doubly-linked node storage
└─ ArrayMap: gap-editable indexed storage
```

`materialize()` keeps using object array-map as its default materialization
target, so callers still get a concrete random-access range unless they opt into
another target with `materialize.of(...)`.
