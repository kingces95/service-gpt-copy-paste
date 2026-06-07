# Partial Receiver Effects

Quest:

Give Parts a first-class way to own receiver state and receiver-side call
effects, so common stateful policies can be declared once on the Part instead
of reimplemented in every concrete constructor or mutating member.

Impetus:

`TypedArrayCursor` repeats the same index machinery already present in
indexable cursors:

```js
_index
get index()
move(offset)
clone()
compareTo(other)
distanceTo(other)
```

That logic wants to live in an `IndexedCursorPart`, but the Part needs a way to
own and initialize its state. The same missing feature shows up in cached
boundary cursors: a cached `end()` cursor is easy to compute, but every mutating
member must remember to invalidate the cache.

Atoms:

```txt
receiver effects
├─ Fields
│  └─ symbol-backed receiver slots owned by the declaring Part
├─ Construct
│  └─ explicit constructor hook that initializes composed Part state
├─ Prolog
│  └─ receiver-side production code run before the member body
└─ Epilog
   └─ receiver-side production code run after the member body
```

Call pipeline:

```txt
member call
├─ argument defaults / transforms
├─ preconditions
├─ receiver prolog
├─ body
└─ receiver epilog
```

`Prolog` is production code, like transforms, but it acts on `this` rather than
on individual arguments. Preconditions stay before prolog so debug checks see
the receiver before production normalization or setup.

Constructor convention:

```js
constructor(...args) {
  super(...args)
  this[Construct](...args)
}
```

JS already requires `super()` in derived constructors, so one more explicit
construction hook is acceptable. The loader owns what `[Construct]` means and
can initialize fields declared by every composed Part.

Field declaration sketch:

```js
const Index = Symbol('Index')

export class IndexedCursorPart extends PartialClass {
  static [Fields] = {
    [Index]: 0,
  }

  get index() { return this[Index] }

  move(offset) {
    this[Index] += offset
    return this
  }
}
```

Fields should compile into symbol-backed receiver slots. The symbol belongs to
the Part, so the storage remains encapsulated even after the Part is composed
onto a concrete cursor.

Epilog declaration sketch:

```js
export class CachedBoundaryRangePart extends PartialClass {
  static [Epilog] = {
    pushRange: this.invalidateBoundaries$,
    popRange: this.invalidateBoundaries$,
  }
}
```

Epilogs should compose like preconditions. A Part names the declared members
whose successful calls should trigger a receiver effect. The effect is a member
call on the receiver, so it can use normal protected Part vocabulary.

Candidate users:

```txt
IndexedCursorPart
├─ owns index field
├─ initializes index from constructor args
└─ hosts move/compare/distance/clone boilerplate

CachedBoundaryRangePart
├─ owns cached boundary cursor fields
├─ computes end/reverse boundary sentinels lazily
└─ invalidates caches after mutating members
```

Open questions:

```txt
Construct idempotence
├─ leaf constructors only call Construct
├─ every constructor may call Construct and loader deduplicates
└─ duplicate construction is an assertion failure
```

```txt
field initialization
├─ static value only: [Index]: 0
├─ function initializer: [Index]: (view, index) => index
└─ richer descriptor if needed later
```

```txt
effect failure
├─ epilog runs only after successful body
├─ epilog runs in finally
└─ separate Epilog and Finally atoms
```

Preference:

Start with `Fields`, `Construct`, and successful-call `Epilog`. That is enough
to pull index state into cursor Parts and cache invalidation into range Parts.
Add `Prolog` when a concrete use appears; the atom belongs in the model now,
but the first implementation can stay narrow.
