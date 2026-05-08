# partial-type

## Summary

Defines `PartialType`, the abstract root of all class-shaped descriptor bundles.

`PartialType` is never instantiated. It is a type-level artifact that can host
prototype descriptors, static metadata, and descriptor compilation rules.

## Root Analogy

- C# attributes: metadata is attached to declarations.
- C# partial classes/interfaces: declarations can describe pieces of a type.
- ES classes: class syntax is used as a convenient descriptor authoring format.

## Public Shape

```js
export class PartialType extends null {
  static [Transparent] = false
  static [Adjacent] = { }
  static [From](typeOrPojo) { ... }
  static [Compile](descriptor) { ... }
}
```

## Important Ideas

`isUserDefined(type)` distinguishes user partial types from `PartialType`
itself and direct framework subclasses.

`[From]` accepts a real partial type or, for transparent partial types, a POJO
that can be turned into an ES class.

`[Compile]` is the descriptor pipeline hook. Concept and abstract attachment
types use this to turn regular method syntax into abstract descriptors.

## File Notes

### `index.js`

Implements `PartialType`, exports core symbols, and provides POJO-to-type
loading for transparent partial types.

### `package.json`

Declares the package as `@kingjs/partial-type`.
