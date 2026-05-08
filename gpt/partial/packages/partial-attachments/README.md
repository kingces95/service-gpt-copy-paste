# partial-attachments

## Summary

Defines transparent descriptor bundles.

Attachments copy members onto a target but do not become part of the target's
composition ancestry.

## Root Analogy

This is like an inline attribute/member block or a descriptor bag. It is not a
named interface or capability; after copying, the members are meant to feel as
though they were defined directly on the target.

## Public Shape

```js
export class Attachments extends PartialType {
  static [Transparent] = true
}

export class AbstractAttachments extends PartialType {
  static [Transparent] = true
  static [Compile](descriptor) { return abstractify(...) }
}
```

## Important Ideas

`Attachments` are used for `Defines` and inline implementation objects.

`AbstractAttachments` are used for `Abstracts` and turn members into abstract
requirements.

Transparency means the descriptor source is not recorded as a partial type of
the host.

## File Notes

### `index.js`

Defines `Attachments` and `AbstractAttachments`. The comments explain the
different declaration styles: class syntax, descriptors, lambdas, named
functions, accessors, constants, and abstract members.

### `unit.test.js`

Tests descriptor behavior and POJO/class equivalence for attachment metadata.

### `package.json`

Declares the package as `@kingjs/partial-attachments`.
