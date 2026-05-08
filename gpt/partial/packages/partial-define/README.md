# partial-define

## Summary

User-facing verb for copying transparent attachments onto a type.

## Root Analogy

Like applying an inline attribute/member block or calling a helper that defines
a group of descriptors on a prototype.

## Public Shape

```js
define(type, ...definitions)
defineAbstract(type, ...definitions)
```

## Important Ideas

`define` converts definitions to `Attachments` using `[From]` and copies them
with `copyTo`.

`defineAbstract` uses `AbstractAttachments` to copy abstract descriptors.

Because attachments are transparent, they do not become associated partial
types of the target.

## File Notes

### `index.js`

Implements `define` and `defineAbstract`.

### `package.json`

Declares the package as `@kingjs/partial-define`.
