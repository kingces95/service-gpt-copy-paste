# partial-compose

## Summary

User-facing verb for composing a `PartialClass` into a target type.

## Root Analogy

Mixin application plus partial-class composition. A named capability part is
merged into a class and recorded as part of the class's composition ancestry.

## Public Shape

```js
compose(type, partialClass, definitions?)
```

## Important Ideas

`compose` requires `partialClass` to be a `PartialClass`.

It copies the partial class into the target, then optionally copies transparent
override definitions.

Non-transparent partial classes are recorded by the reflector as adjacent types
of the target.

## File Notes

### `index.js`

Implements `compose`.

### `integration.test.js`

Tests composition behavior across composed types.

### `legacy.test.js`

Preserves behavior from earlier designs.

### `thunk.test.js`

Tests interaction between composition and thunk/precondition behavior.

### `package.json`

Declares the package as `@kingjs/partial-compose`.
