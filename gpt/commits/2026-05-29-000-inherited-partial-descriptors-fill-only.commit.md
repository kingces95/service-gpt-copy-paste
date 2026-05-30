# Inherited Partial Descriptors Fill Only

This checkin establishes an ownership rule for Partial composition: inherited
descriptors fill gaps, but they do not replace explicit implementations.

A descriptor inherited through a Part is available as a default implementation.
It can satisfy missing surface area on a concrete type, but once a concrete
implementation has been installed, the inherited descriptor must not whack it.
Only descriptors owned by the declaration currently being applied may overwrite
according to declaration policy.

One motivating case is gap-backed bulk assignment. `GapAssignableContainerPart`
extends `GapEditableContainerPart` and inherits the gap-editing surface needed
to implement assignment:

```js
class GapAssignableContainerPart extends BulkAssignableContainerPart {
  static [Extends] = [
    GapEditableContainerPart,
  ]

  resize(count, value = this.defaultValue$) { /* uses openGap$/closeGap$ */ }
  assignRange(range) { /* uses insertRange */ }
}
```

A concrete gap-backed container declares the base obligations first, then
composes the consuming Part:

```js
extend(this, BulkAssignableContainerPart, {
  get defaultValue$() { return 0 },
}, {
  resize(count, value) { },
  assignRange(range) { },
})

extend(this, GapEditableContainerPart, {
  openGap$(cursor, count) { },
  closeGap$(first, last) { },
})

extend(this, GapAssignableContainerPart)
```

`BulkAssignableContainerPart` makes `resize` and `assignRange` visible as
still-abstract obligations. `GapEditableContainerPart` owns the concrete gap
operations. `GapAssignableContainerPart` then consumes those visible
obligations, but its inherited `GapEditableContainerPart` descriptors must not
replace the concrete gap implementation already installed by the container.

That gives Partial composition a stable precedence rule:

```txt
descriptor copy
├─ own descriptor
│  └─ may overwrite by declaration policy
└─ inherited descriptor
   └─ fills only
```

## Loader Notes

The loader now treats procedural and declarative Partial extension as the same
composition fact.

Declarative extension:

```js
class ForwardCursorPart extends PartialClass {
  static [Extends] = SteppableCursorPart
}
```

Procedural extension:

```js
class ForwardCursorPart extends PartialClass {
  static {
    extend(this, SteppableCursorPart)
  }
}
```

Both say that `ForwardCursorPart` is composed with `SteppableCursorPart`. When
the target is another Partial type, the loader records that adjacency instead
of eagerly copying descriptors. Copying is deferred until the Partial graph is
applied to a concrete type.

```txt
Partial-to-Partial extension
├─ record adjacent type
└─ defer descriptor materialization

Partial-to-concrete extension
├─ materialize composed descriptor surface
├─ own descriptors may overwrite by declaration policy
└─ inherited descriptors fill only
```

This keeps the procedural verb from creating a different prototype shape than
the declarative metadata. Both paths feed the same loader model before runtime
surface is materialized.

## Impact

```txt
Impact
├─ Partial loader policy
│  ├─ procedural and declarative extension share composition semantics
│  ├─ Partial-to-Partial extension records composition instead of copying
│  └─ inherited descriptors fill without replacing concrete implementations
├─ Prototype reflection
│  ├─ getDescriptor/getValue resolve the effective surface
│  ├─ hasGetter/hasSetter test resolved accessor slots
│  ├─ findDescriptors/findValues enumerate candidates
│  └─ descriptors/values/keys/copyTo accept splitAccessors
├─ Descriptor algebra
│  ├─ mergeAccessors(existing, descriptor)
│  └─ subtractSlots(descriptor, covered)
├─ Regression coverage
│  ├─ inherited-fill descriptor behavior
│  ├─ procedural/declarative extension equivalence
│  └─ setter-before-getter split accessor lookup
└─ Model coverage
   └─ prototype/model.md records own/search/resolve/materialize views
```
