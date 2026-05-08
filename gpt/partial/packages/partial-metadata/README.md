# partial-metadata

## Summary

Projects static metadata and conditions across the composed partial chain.

`PartialReflect` mainly reflects instance descriptors. `partial-metadata`
creates parallel metadata chains from static field descriptors and condition
objects.

## Root Analogy

C# reflection over attributes and associated metadata, but translated to ES
static fields and symbol-keyed metadata.

## Important Ideas

`PartialMetadata` maps a type's composed instance prototype hierarchy into a
parallel static metadata hierarchy.

This solves cases where metadata such as `cursorType` is contributed by a
partial type rather than the concrete class directly.

`satisfiesAssociations(ctor, partialType)` checks associated partial types, such
as a type's associated `cursorType` satisfying the concept's associated
`cursorType`.

`PartialPreconditions` and `PartialPostconditions` expand static condition POJOs
into prototype-like chains.

`getConditions(type, key)` returns the type/member preconditions and
postconditions that should wrap a member.

## File Notes

### `index.js`

Implements metadata projection, associated partial type checks, and condition
collection.

### `package.json`

Declares the package as `@kingjs/partial-metadata`.
