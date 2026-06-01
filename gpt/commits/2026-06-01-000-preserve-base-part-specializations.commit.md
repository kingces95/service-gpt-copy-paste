# Preserve Base Part Specializations

A concrete implementation attached to a base Part must survive later
composition of a derived Part.

```js
compose(this, BasePart, {
  member() { return 'specialized' },
})

compose(this, DerivedPart)
```

The expected behavior is that `member()` remains specialized:

```js
new SpecializedType().member() == 'specialized'
```

The bug appeared when the later `DerivedPart` also composed `BasePart` and
supplied a default implementation. That default could overwrite the concrete
implementation already attached to `BasePart`.

```txt
BasePart declares member
DerivedPart composes BasePart and supplies a default
Type specializes BasePart.member
Type later composes DerivedPart

expected: Type keeps the specialized implementation
actual:   DerivedPart default could replace it
```

The concrete case was `ClearableContainerPart.clear`.
`BulkAssignableContainerPart` composes `ClearableContainerPart` and supplies
the default `clear` behavior. A container can specialize
`ClearableContainerPart.clear`, then later compose
`GapAssignableContainerPart` or `BulkAssignableContainerPart`; that later
default must not replace the container's specialized `clear`.

The fix preserves the normal merge-order rules while ensuring implementation
bodies are ordered so explicit specializations continue to win over later
defaults.
