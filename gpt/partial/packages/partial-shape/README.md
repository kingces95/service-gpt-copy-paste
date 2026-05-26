# partial-shape

## Summary

Defines structural type-level requirements.

`Shape` is the STL-ish sibling of `Concept`: it describes a required descriptor
surface over constructor types, but it does not publish itself as nominal
composition on ordinary types.

## Root Analogy

STL named concepts.

```txt
std::forward_iterator<I>
└─ compile-time structural predicate

Shape
└─ runtime-reflective descriptor predicate over constructor prototypes
```

## Key Distinction

```txt
Concept
└─ nominal
└─ published into the normal meta-prototype chain

Shape
└─ structural
└─ transparent outside its own family
└─ queried by strict descriptor matching

Probe
└─ observational
└─ works on wild runtime values
```

The old observational `partial-shape` role moved to `@kingjs/probe`. See
[Shape to Probe](../../../notes/2026-05-20-001-shape-to-probe.notes.md).

## Public Surface

`Shape` declares:

```js
static [Transparent] = true

static [Adjacent] = {
  [Defines]: Attachments,
  [Includes]: Shape,
}
```

`Includes` composes shapes with other shapes.

`Defines` gives shapes the same implementation lane that concepts have.

## Related

- [Partial Shape Design](../../../notes/2026-05-20-003-partial-shape-design.notes.md)
- [Partial Shape and Satisfy](../../../notes/2026-05-20-004-partial-shape-and-satisfy.notes.md)
