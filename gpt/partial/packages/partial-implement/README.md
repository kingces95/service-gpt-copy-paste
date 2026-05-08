# partial-implement

## Summary

User-facing verb for composing a `Concept` into a concrete type.

## Root Analogy

C# interface implementation plus C++ concept satisfaction, but certified at
runtime through partial composition metadata.

## Public Shape

```js
implement(type, concept, implementation = { })
```

## Important Ideas

`implement` requires the second argument to extend `Concept`.

The implementation POJO is converted to `Attachments`.

Implementation members are restricted to members declared by the concept. This
prevents a concept implementation block from quietly adding unrelated members.

The concept is copied first, then implementation members are copied over it.

## File Notes

### `index.js`

Implements concept composition and implementation member validation.

### `unit.test.js`

Tests concept implementation, rejected extra members, abstract methods,
accessors, and associated concepts.

### `package.json`

Declares the package as `@kingjs/partial-implement`.
