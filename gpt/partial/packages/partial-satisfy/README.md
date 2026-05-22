# partial-satisfy

## Status

Retired. The live package was deleted after `Shape` settled as a structural
descriptor query in `@kingjs/partial-shape`.

## Summary

Originally defined a structural copy verb for `Shape`, mirroring `implement`
but using `Shape` instead of `Concept`.

## Translation

```txt
implement(type, concept)
└─ nominal concept composition

retired shape copy verb
└─ structural shape composition
```

The current model does not use a public `satisfy` verb. Shape satisfaction is
queried structurally with `instanceof Shape`, backed by strict descriptor
matching over the candidate constructor prototype.

## Related

- [partial-shape](../partial-shape/README.md)
- [Partial Shape and Satisfy](../../../notes/2026-05-20-004-partial-shape-and-satisfy.notes.md)
