# partial-concept

## Summary

Defines certified runtime concepts.

A `Concept` is a named protocol. Implementing a concept records certification
and copies abstract requirements/default definitions. `instanceof Concept`
tests composition plus strict duck-cast compatibility.

## Root Analogy

- C# interfaces: named contracts.
- C++ concepts: named capability requirements.
- Runtime reflection: concept membership can be inspected after loading.

## Public Shape

```js
export class Concept extends PartialType {
  static [Adjacent] = {
    [Defines]: Attachments,
    [Implements]: Concept,
  }

  static [Compile](descriptor) { return abstractify(...) }
  static [Symbol.hasInstance](instance) { ... }
  static [Precondition](type) { ... }
}
```

## Important Ideas

Concept descriptors compile to abstract members.

`[Defines]` lets a concept add default helper members.

`[Implements]` lets concepts refine other concepts.

`Symbol.hasInstance` makes `obj instanceof MyConcept` mean "the object's
constructor is composed of this concept and still matches its required shape."

Associated metadata lets a concept require associated types, such as a range
concept requiring a cursor type that satisfies a cursor concept.

## File Notes

### `concept.js`

Implements the `Concept` base class, descriptor abstractification,
`instanceof` behavior, and associated concept precondition.

### `index.js`

Exports `Concept` and the built-in concepts.

### `concepts/scope.js`

Defines `ScopeConcept`, the base for concepts that reason about a scope or
range of valid comparison.

### `concepts/equatable.js`

Defines `EquatableConcept`. Current local change adds a default
`equals(other) { return this == other }` in `[Defines]`, making equality a
default helper that can be overridden.

### `concepts/dispose.js`

Defines disposal-related concept metadata.

### `unit.test.js`

Tests concept implementation, abstract members, member shape validation, and
associated concept behavior.

### `integration.test.js`

Tests information/projection behavior for concepts in richer examples.

### `instanceof.test.js`

Tests `instanceof` semantics for concept certification and duck-cast checks.

### `package.json`

Declares the package as `@kingjs/partial-concept`.
