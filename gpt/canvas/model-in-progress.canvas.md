# Model In Progress

Model for container precondition structure. The model names assertion members
without the `Assert$` suffix; code keeps the full readable names.

ArgChecks run before Preconditions. Required cursor-typed arguments have already
passed their concept checks before this model runs. Defaulted trailing cursor
arguments are still validated here after the default expression has been
applied by the precondition signature.

```txt
Preconditions

ContainerPart
└─ assert$
   ├─ notNull(value)
   ├─ nonEmpty()
   ├─ ownCursor(cursor)
   │  └─ notNull(cursor)
   ├─ notEnd(cursor)
   ├─ firstThenLast(first, last)
   └─ ownCursorPair(first, last)
      ├─ ownCursor(first)
      ├─ ownCursor(last)
      └─ firstThenLast(first, last)

FrontInsertableContainerPart
└─ popFront()
   └─ nonEmpty()

BackInsertableContainerPart
└─ popBack()
   └─ nonEmpty()

EditableContainerPart
├─ insertValue(cursor, value)
│  └─ ownCursor(cursor)
└─ erase(first, last = next(first))
   └─ ownCursorPair(first, last)

PhasedContainerPart
├─ assert$
│  └─ ownButNotEndCursor(cursor)
│     ├─ ownCursor(cursor)
│     └─ notEnd(cursor)
├─ insertValueAfter(cursor, value)
│  └─ ownButNotEndCursor(cursor)
└─ eraseAfter(first, last = next(first, 2))
   ├─ ownButNotEndCursor(first)
   └─ ownCursorPair(next(first), last)

IndexableContainerPart
├─ assert$
│  └─ lessThanSize(index)
├─ at(index)
│  └─ lessThanSize(index)
└─ setAt(index, value)
   └─ lessThanSize(index)

BulkEditableContainerPart
├─ insertRange(cursor, range)
│  └─ ownCursor(cursor)
├─ insert(cursor, count, value)
│  └─ ownCursor(cursor)
└─ replaceRange(first, last, replacementRange)
   └─ ownCursorPair(first, last)

PhasedBulkContainerPart
├─ insertRangeAfter(cursor, range)
│  └─ ownButNotEndCursor(cursor)
├─ insertAfter(cursor, count, value)
│  └─ ownButNotEndCursor(cursor)
└─ replaceRangeAfter(first, last, replacementRange)
   ├─ ownButNotEndCursor(first)
   └─ ownCursorPair(next(first), last)
```
