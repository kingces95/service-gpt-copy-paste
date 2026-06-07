# Cached End Cursor

Quest:

Avoid repeated `end()` cursor allocation on hot paths by making end cursors
cacheable and explicitly immutable when a cursor type can support that contract.

Impetus:

`end()` appears everywhere:

```js
cursor.equals(range.end())
previous(range.end(), count)
this.source.end()
```

That surface is ergonomic, but each call typically allocates a fresh cursor. The
local fixes are all the same kind of boilerplate: cache an end cursor, clone it
before returning, and remember to invalidate it after mutation. That spreads a
container-wide policy into every container that cares about the allocation.

Model:

```txt
range.end()
├─ mutable cursor
│  └─ fresh allocation, current behavior
└─ frozen cursor
   ├─ cached by the range/container
   ├─ safe to share
   └─ never stepped or otherwise mutated
```

Reverse traversal has the same sentinel pressure:

```txt
reverse range
├─ reverseBegin()
│  └─ forward end sentinel viewed through reverse traversal
└─ reverseEnd()
   └─ forward begin sentinel viewed through reverse traversal
```

If reverse cursors allocate their own sentinel wrappers, then reverse begin/end
should be cached under the same frozen-sentinel policy. The important invariant
is not "end only"; it is "stable boundary cursors that are compared often and
should not be mutated."

Possible surface:

```js
range.end()
range.end({ frozen: true })
range.reverseBegin({ frozen: true })
range.reverseEnd({ frozen: true })
```

The default stays conservative and returns a mutable cursor. Code that only
compares against the end sentinel can ask for the frozen end and avoid churn.

Policy:

```txt
cached end cursor
├─ opt-in at the callsite
├─ supported only by cursor types that can freeze or are otherwise immutable
├─ invalidated by container mutation
├─ never returned from APIs that promise a mutable cursor
├─ never exposed as mutable state
└─ applies to reverse boundary cursors too
```

The caller chooses `frozen: true` only when it will treat the cursor as a
sentinel. Algorithms that need to move the cursor still request the normal
mutable form or clone the frozen cursor explicitly.

Candidate cursor protocol:

```txt
FreezableCursorPart
├─ freeze()
└─ isFrozen$
```

Mutable cursor operations assert `!isFrozen$`. Containers may cache frozen
cursors once and return the same frozen object until invalidated.

Candidate container protocol:

```txt
CachedBoundaryRangePart
├─ end({ frozen: true })
│  └─ return cached frozen end
├─ reverseBegin({ frozen: true })
│  └─ return cached frozen reverse begin
├─ reverseEnd({ frozen: true })
│  └─ return cached frozen reverse end
├─ end()
│  └─ return mutable end
└─ invalidateBoundaries$()
   └─ clear cached frozen boundary cursors after mutation
```

Open questions:

```txt
surface
├─ end({ frozen: true })
├─ reverseBegin({ frozen: true })
├─ reverseEnd({ frozen: true })
├─ frozenEnd()
└─ endFrozen()
```

```txt
cursor support
├─ require FreezableCursorPart
├─ allow immutable cursor types without freeze()
└─ use clone-on-freeze for legacy cursors
```

```txt
algorithm policy
├─ algorithms request frozen ends for comparisons
├─ algorithms keep allocating until specialized
└─ algorithm specialization decides per range type
```

```txt
invalidation policy
├─ mutation members call invalidateBoundaries$() by hand
├─ mutation members are wrapped by a post-call hook
└─ partial loader supports a member transform that runs after the call
```

Preference:

Start with `end({ frozen: true })`. It keeps the existing range vocabulary and
makes the allocation policy visible at the callsite. Add the frozen cursor
contract before rewriting callsites broadly, so debug assertions can catch code
that accidentally steps a shared sentinel.

Once the end cursor experiment works, extend the same protocol to reverse
boundary cursors. That keeps reverse traversal from becoming a second,
hand-rolled cache policy.

Invalidation is likely the real feature. Caching the sentinel is straightforward;
remembering to clear it after every mutation is where boilerplate and mistakes
creep in. A future loader hook could attach post-call behavior to members, much
like transforms attach pre-call runtime behavior today, except the hook would run
after the implementation and receive `this`. Then cache invalidation could be
declared next to the member metadata instead of mixed into the method body:

```js
pushRange: signature(this, {
  types: [RangeShape],
  after() { this.invalidateBoundaries$() },
}, function pushRange(range) {
  this.source.pushRange(range)
  return this
})
```

That would let mutation logic stay focused on mutation while boundary-cache
policy lives in the declaration layer.
