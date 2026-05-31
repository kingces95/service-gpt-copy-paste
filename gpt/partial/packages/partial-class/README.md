# partial-class

## Summary

Defines `PartialClass`, the implementation/capability part type.

Partial classes are non-transparent descriptor contributors. When composed into
a target, they become part of the target's meta-prototype chain.

## Root Analogy

C# partial classes plus mixins: a named piece of a type can contribute members,
abstract requirements, implemented concepts, and dependencies on other partial
classes.

## Public Shape

```js
export class PartialClass extends PartialType {
  static [Declarative] = Composes
  static [Procedural] = 'compose'
  static [Adjacent] = [
    Attachments,
    AbstractAttachments,
    PartialClass,
    Concept,
  ]
}
```

## Important Ideas

`PartialClass` can declare:

- `[Defines]`: concrete transparent members
- `[DefinesAbstract]`: abstract required members
- `[Composes]`: other partial classes
- `[Implements]`: concepts

It borrows `Concept` instance/precondition behavior so partial classes can
participate in the same certification machinery.

## File Notes

### `index.js`

Defines `PartialClass`, exports the major metadata symbols, and declares the
adjacency grammar for partial-class metadata.

### `unit.test.js`

Tests partial-class composition, declared composition, procedural composition, and
reflection of contributed members.

### `package.json`

Declares the package as `@kingjs/partial-class`.
