# Account For Abstract Declaration Members

Partial declarations now make abstract obligations explicit.

`implement(Type, Concept, impl, stillAbstract)` and
`extend(Type, Part, impl, stillAbstract)` share the same declaration path. The
fourth argument is an abstract attachment surface: descriptor-shaped stubs that
say, "this member is intentionally still abstract here."

```js
implement(Type, Concept, {
  foo() { },
}, {
  bar() { },
  get baz() { },
})

extend(Type, Part, {
  foo() { },
}, {
  bar() { },
})
```

The invariant is:

```txt
abstract declared member
├─ implemented here
├─ already concrete on the target
└─ explicitly still abstract here
```

The fourth argument is checked against the declared descriptor shape before it
can account for an abstract member. Accessors, symbols, and descriptor metadata
therefore remain part of the contract rather than being reduced to names.

Partial accessors are accounted for descriptor-first:

```txt
abstract property
├─ concrete getter supplied by implementation
└─ abstract setter carried by stillAbstract
```

That lets a declaration satisfy one accessor half while deliberately carrying
the other half forward as abstract.

Abstract declaration stubs are also covered as declarations. `Descriptor.cover`
hosts the descriptor-level invocation primitive, `cover(...)` delegates to it,
and `AbstractAttachments` invokes descriptor stubs before abstractifying them.
That keeps coverage aligned with the declaration model without asking callsites
to wrap every inert stub manually.
