# Method Precondition

Keep the method about the work; let metadata guard the door.

Turn guard clauses scattered through methods into contract metadata that wraps
the method automatically.

## The JavaScript Idiom

The ordinary pattern is to write precondition checks inside the method.

```js
class Cursor {
  step() {
    if (this.equals(this.range.end()))
      throw new RangeError('Cannot move cursor out of bounds.')

    this.index++
    return this
  }
}
```

This works, but the rule is buried inside the implementation.

## Declarative Translation

Declare the precondition separately.

```js
class CursorConcept extends Concept {
  static [Preconditions] = {
    step() {
      if (this.equals(this.range.end()))
        throwMoveOutOfBounds()
    },
  }

  step() { }
}
```

Then a concrete implementation focuses on movement:

```js
implement(IndexableCursor, CursorConcept, {
  step() { return this.move(1) },
})
```

The concrete method stays small, while the inherited contract still protects
the call:

```js
const cursor = range.end()

cursor.step() // throws before move(1) runs
```

`PartialProxy` and the reflector can wrap the method with the relevant checks.

## Why This Matters

Preconditions become inherited contract metadata. A concept can contribute both
the required member and the runtime rule that protects it.

This gives JavaScript a design-by-contract flavor without turning every method
body into guard boilerplate.
