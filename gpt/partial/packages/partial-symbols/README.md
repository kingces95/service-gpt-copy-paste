# partial-symbols

## Summary

Defines the shared symbol vocabulary used by the whole partial system.

This is the local equivalent of a small reflection metadata schema: all higher
layers agree on symbols like `Defines`, `Extends`, `Implements`,
`Preconditions`, and `Compile`.

## Root Analogy

C# custom attributes use named metadata channels attached to declarations.
This package provides JavaScript symbol channels for similar metadata.

## Important Symbols

- `Adjacent`: which static metadata keys introduce adjacent partial types.
- `Compile`: descriptor transform hook.
- `From`: loader hook from type or POJO.
- `Transparent`: whether a partial type is associated with the host.
- `Precondition`: type-level precondition hook.
- `CreateThunk`: member wrapper hook.
- `Preconditions` / `Postconditions`: member condition metadata.
- `Implements`: concept adjacency.
- `Extends`: partial-class adjacency.
- `Defines`: transparent concrete attachments.
- `Abstracts`: transparent abstract attachments.

## File Notes

### `index.js`

Exports every shared symbol and `isTransparent(type)`.

This file is intentionally simple: the symbols are the grammar of the rest of
the system.

### `package.json`

Declares the package as `@kingjs/partial-symbols`.
