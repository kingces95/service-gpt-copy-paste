# partial-shape

## Summary

Defines loose observational duck types.

Shapes are for external or wild JavaScript values that did not opt into
concept certification.

## Root Analogy

Structural typing and duck typing. Compared to `Concept`, this is closer to
TypeScript structural checks or runtime "does it quack?" validation.

## Key Distinction

```text
Concept
  certified, opt-in, non-observational

Shape
  observational, permissive, may invoke getters/proxies
```

## Important Ideas

`Shape` extends `PartialType` but cannot be extended/composed like a normal
partial type.

`Shape[Symbol.hasInstance]` tests whole-value constraints such as `typeof`,
`tag`, prototype, constructability, and then uses duck-cast reflection.

Built-in shapes include POJO, iterable, iterator, error, event target, promise,
thenable, callable, constructors, async shapes, and disposable shapes.

## File Notes

### `index.js`

Exports `Shape` and the built-in shapes.

### `shape.js`

Implements the `Shape` base class and `instanceof` behavior.

### `shapes.js`

Defines common shapes such as `PojoShape`, `IterableShape`,
`PromiseShape`, `ThenableShape`, `CallableShape`, and constructor shapes.

### `unit.test.js`

Tests shape behavior.

### `shapes.test.js`

Tests built-in shapes.

### `package.json`

Declares the package as `@kingjs/partial-shape`.
