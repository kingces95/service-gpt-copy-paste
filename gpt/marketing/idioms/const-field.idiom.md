# Const Field

Keep the descriptor power; lose the descriptor ceremony.

JavaScript already has a powerful object descriptor system. This project makes
those descriptor idioms declarative, composable, and reflectable.

## The JavaScript Idiom

JavaScript can attach a constant-like field to a prototype by defining a
descriptor directly.

Raw idiom:

```js
class Range {
  static {
    Object.defineProperty(this.prototype, 'cursorType', {
      value: Cursor,
      writable: false,
      enumerable: true,
      configurable: false,
    })
  }
}
```

This is powerful because descriptors can express things plain assignment cannot:

- non-writable
- non-configurable
- enumerable or hidden
- getter/setter/value shape

But it is also noisy. The intent is small: "this type has a const field." The
ceremony is large.

## Declarative Translation

The partial loader can make the descriptor block declarative.

```js
import { Defines } from '@kingjs/partial-class'

class RangePart extends PartialClass {
  static [Defines] = {
    cursorType: {
      value: Cursor,
      writable: false,
      enumerable: true,
      configurable: false,
    },
  }
}
```

Then a concrete type can compose it:

```js
class Range extends PartialProxy {
  static {
    extend(this, RangePart)
  }
}
```

The resulting type exposes the descriptor-backed field without hand-writing the
descriptor at the use site:

```js
const range = new Range()

range.cursorType // Cursor
range.cursorType = OtherCursor // ignored or rejected by descriptor semantics
```

Or, for a local attachment:

```js
class Range extends PartialProxy {
  static {
    define(this, {
      cursorType: {
        value: Cursor,
        writable: false,
        enumerable: true,
        configurable: false,
      },
    })
  }
}
```

## Why This Matters

The declarative version does more than shorten syntax.

Because the descriptor lives in metadata, the loader can:

- copy it consistently
- preserve descriptor semantics
- reflect where it came from
- include it in docs
- combine it with other partial declarations
- avoid accidental overwrite rules

The system turns a one-off JavaScript descriptor idiom into a reusable
declaration that participates in the rest of the project.
