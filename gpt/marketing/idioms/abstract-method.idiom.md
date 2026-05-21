# Abstract Method

Abstract members should be declarations, not booby traps.

Turn "please override this" from a hand-written throwing method into metadata
the loader can understand.

## The JavaScript Idiom

JavaScript has no native abstract methods, so the usual idiom is a method that
throws.

```js
class Range {
  begin() {
    throw new Error('Not implemented.')
  }

  end() {
    throw new Error('Not implemented.')
  }
}
```

This works, but it is only behavior. Reflection cannot easily distinguish
"abstract requirement" from "method that happens to throw."

## Declarative Translation

The partial system can mark members as abstract requirements.

```js
import { Abstracts } from '@kingjs/partial-class'

class RangePart extends PartialClass {
  static [Abstracts] = {
    begin() { },
    end() { },
  }
}
```

A concrete class can then extend the part and fill the requirements:

```js
class VectorRange extends PartialProxy {
  static {
    extend(this, RangePart, {
      begin() { return new this.cursorType(this, 0) },
      end() { return new this.cursorType(this, this.size) },
    })
  }
}
```

Call sites can use the concrete range normally, while reflection can still see
which members came from the abstract part:

```js
const range = new VectorRange([1, 2, 3])

copy(target, range.begin(), range.end())
```

## Why This Matters

The loader can preserve the difference between abstract and concrete members.
Abstract members do not overwrite concrete implementations, and reflection can
show what a partial part requires.

The result feels closer to C# abstract/interface declarations while staying in
plain JavaScript class syntax.
