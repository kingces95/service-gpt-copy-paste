# partial-reflect

## Summary

Exports the repo's configured `PartialReflect` instance and `copyTo` function.

This is the public reflection facade over `partial-reflector`.

## Root Analogy

C# `System.Reflection`, but aimed at the meta-prototype chain created by
partial composition rather than only the normal runtime class hierarchy.

## Public Shape

```js
export const { PartialReflect, copyTo } = create({
  knownStaticKeys: [
    Defines,
    Extends,
    Implements,
  ]
})
```

## Important Ideas

The reflector is configured with the static metadata keys that matter to this
partial ecosystem.

Most other packages use `PartialReflect` to ask questions like:

- is this type an extension of `Concept`?
- what keys does a partial type contribute?
- what base types appear in the meta-prototype chain?
- can an instance duck-cast to this concept?

## File Notes

### `index.js`

Imports `create` from `partial-reflector`, supplies known static keys, and
exports `PartialReflect` plus `copyTo`.

### `unit.test.js`

Tests reflection over partial hierarchies and descriptor behavior.

### `legacy.test.js`

Preserves expected behavior from older reflection designs.

### `loader.test.js`

Tests loading/reflection behavior that depends on partial declarations.

### `package.json`

Declares the package as `@kingjs/partial-reflect`.
