# partial-satisfy

## Summary

Defines the structural copy verb for `Shape`.

```js
satisfy(type, shape, implementation)
```

`satisfy` mirrors `implement`, but uses `Shape` instead of `Concept`.

## Translation

```txt
implement(type, concept)
└─ nominal concept composition

satisfy(type, shape)
└─ structural shape composition
```

`satisfy` copies Shape descriptors and optional implementation descriptors onto
the target type. Because Shape is transparent outside its own family, the Shape
does not appear as nominal composition on ordinary types.

## Related

- [partial-shape](../partial-shape/README.md)
- [Partial Shape and Satisfy](../../../notes/2026-05-20-004-partial-shape-and-satisfy.notes.md)
