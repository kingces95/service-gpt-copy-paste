# Static Metadata Block

Stop hiding declarations inside imperative class setup.

JavaScript static blocks are powerful, but they make durable intent look like
startup code. The project keeps the static block as the attachment point and
moves the meaning into symbol-keyed metadata.

## The JavaScript Idiom

A class often wires descriptors or relationships in a static block.

```js
class Range {
  static {
    Object.defineProperty(this.prototype, 'cursorType', {
      value: Cursor,
      writable: false,
    })
  }
}
```

This works, but reflection sees the result after the fact. It cannot easily
tell whether `cursorType` was a design declaration, a cache, or incidental
setup code.

## Declarative Translation

Attach a metadata block under a symbol and let a loader understand it.

```js
class RangePart extends PartialClass {
  static [Defines] = {
    cursorType: {
      value: Cursor,
      writable: false,
    },
  }
}

class VectorRange extends PartialProxy {
  static {
    extend(this, RangePart)
  }
}
```

The class still uses normal JavaScript class syntax, but the interesting part
is now data.

## Why This Matters

Static blocks become the place declarations are attached, not where every
loader concern is hand-coded.

That gives docs, tests, reflection, and future tooling something stable to
read. The metadata can be copied, checked, transformed, and explained without
reverse-engineering arbitrary setup code.
