# partial-reflector

## Summary

The engine room. Builds meta-prototype chains, resolves partial type graphs,
copies descriptors, and records composition ancestry.

## Root Analogy

This is a JavaScript runtime reflection engine inspired by:

- ES prototype chains
- C# reflection
- mixin linearization
- multiple inheritance linearization
- C# partial/interface metadata

## Core Idea

Normal JavaScript gives a runtime prototype chain. `partial-reflector` builds a
meta-prototype chain that inserts declared and procedural partial types into
that chain.

Partial types can be related by:

- ES class inheritance
- static metadata declarations such as `[Extends]`
- procedural calls such as `extend(type, partial)`

The graph is linearized into a merge order. Duplicate partials are deduped with
last declaration winning.

## Key Mechanics

`mergeOrder(type)` linearizes the base type and adjacent partial types.

`ownDeclaredAdjacentPartialTypes(type)` reads static symbol metadata declared by
the partial type's `[Adjacent]` grammar.

`AdjacentTypes` records procedural composition, such as calls to `extend` or
`implement`.

`compiledPrototype` applies each type's `[Compile]` hook to descriptors.

`unifiedPrototype` merges transparent attachments with their host.

`create(...)` returns a configured reflector and `copyTo(...)`.

`copyTo(partialType, type)` copies descriptors to a target prototype, creates
thunks if requested, calls type preconditions, and records non-transparent
partial ancestry.

## File Notes

### `index.js`

Contains the whole reflector engine and extensive design commentary. This is
the deepest explanatory source file for the partial system.

### `package.json`

Declares the package as `@kingjs/partial-reflector`.
