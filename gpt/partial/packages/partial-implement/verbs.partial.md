# Verb: implement

## Purpose

`implement` composes a `Concept` into a concrete type.

It says: this type is certified to satisfy this concept, and here are the
members that fulfill the concept's requirements.

## Local Style

```js
implement(IndexableCursor, RandomAccessCursorConcept, {
  move(offset) { this._index += offset; return this },
  distanceTo(other) { return other.index - this.index },
})
```

## Guardrail

Implementation members must be declared by the concept. This keeps an
implementation block from becoming an accidental random attachment bag.
