# Associated Types

## Original Idea

Generic systems often have associated types:

- an STL range has an iterator type
- a collection has an item type
- a parser has a token type

C# and C++ expose these differently, but the recurring idea is that a type's
metadata can point at another type that must satisfy its own requirements.

## Local Model

`partial-metadata` can test associated partial types by looking at static
metadata across the composed chain.

Example from cursor concepts:

```js
export class RangeConcept extends Concept {
  static cursorType = CursorConcept
}

class MyRange {
  static cursorType = MyCursor
}
```

The range concept can require that `MyRange.cursorType` is composed of the
concept declared by `RangeConcept.cursorType`.

## Why This Matters

This lets concepts express relationships between types, not just members on one
prototype. That matters for range/cursor, container/span, and future metadata
systems.
