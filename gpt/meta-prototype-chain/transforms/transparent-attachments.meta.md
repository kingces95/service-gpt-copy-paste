# Transparent Attachments

Some contributors should affect behavior without becoming architecture.

Attachments are descriptor groups. They are useful as implementation payloads,
but the system usually wants the surrounding partial class or concept to get
credit for the contribution.

## Source

- `packages/partial-attachments/index.js`
- `packages/partial-reflector/index.js`
- `packages/partial-extend/index.js`
- `packages/partial-implement/index.js`

## The Pain

Declarative metadata often contains small POJOs:

```js
static [Defines] = {
  next() {
    const value = this.value
    this.step()
    return value
  }
}
```

Internally, the POJO has to become a partial type so descriptors can be copied.
But exposing every little POJO as a durable architectural part would make the
composition graph noisy.

## The Transform

`Attachments` are marked transparent:

```js
export class Attachments extends PartialType {
  static [Transparent] = true
}
```

`unifiedPrototype` folds transparent declared attachments into the host link:

```js
class InputCursorConcept extends Concept {
  static [Defines] = {
    next() {
      const value = this.value
      this.step()
      return value
    },
  }

  get value() { }
  step() { }
}
```

```js
const transparentTypes = ownDeclaredAdjacentPartialTypes(type)
  .filter(partialType => isTransparent(partialType))
const types = [ ...transparentTypes, type ]
return compiledPrototype.reduce(types, { map: resolve })
```

```txt
Source declaration tree:

InputCursorConcept
└─ Attachments from [Defines] (next)

Unified prototype link:

InputCursorConcept (value, step, next)
```

The attachment contributes `next`, but it does not become a durable associated
partial type of consumers.

## What It Describes

This transform separates implementation payload from architectural identity.

The descriptor arrives, but the docs can still say the concept or partial
class contributed the behavior.

## Marketing Hook

This is declarative sugar without provenance pollution. POJOs can become real
descriptor sources internally, while public reflection stays focused on the
meaningful parts.
