# partial-proxy

## Summary

Provides runtime thunking for methods and accessors.

Concrete classes can extend `PartialProxy` to have copied members wrapped with
preconditions and postconditions.

## Root Analogy

Design by contract and C# attribute-like method interception, but implemented
through descriptor thunking.

## Public Shape

```js
export class PartialProxy {
  static [CreateThunk](key, descriptor) {
    if (isAbstract(descriptor)) return descriptor
    return thunkFactory.create(this, key, descriptor)
  }
}
```

## Important Ideas

`PartialProxy` delegates condition discovery to `partial-metadata`.

`CreateThunk` is the hook used by `partial-reflector` when copying descriptors.

Abstract descriptors are not wrapped.

## File Notes

### `index.js`

Defines `PartialProxy` and exports condition symbols. Uses `Es6ThunkFactory`
and `FunctionBuilder` to build wrappers from collected conditions.

### `unit.test.js`

Tests precondition/postcondition thunk behavior.

### `package.json`

Declares the package as `@kingjs/partial-proxy`.
