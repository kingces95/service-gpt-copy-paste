# Default Helper Method

Contracts can bring their own convenience methods.

Turn helper methods that naturally belong to a contract into default concept
members.

## The JavaScript Idiom

When several types implement the same core operation, helper methods are often
copied by hand or redefined repeatedly.

```js
class MyCursor {
  next() {
    const value = this.value
    this.step()
    return value
  }
}
```

Every cursor with `value` and `step` can support `next`, but manually repeating
it is noise.

## Declarative Translation

A concept can define helper members in `[Defines]` beside the requirements that
justify them.

```js
class InputCursorConcept extends CursorConcept {
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

Then a concrete cursor implements only the primitive operations:

```js
class ListCursor extends ContainerCursor {
  static {
    implement(this, InputCursorConcept, {
      get value() { return this.link.value },
      step() { this.link = this.link.next; return this },
    })
  }
}
```

The helper arrives through the concept:

```js
const cursor = list.begin()
const first = cursor.next()
```

Any type implementing the concept receives `next` unless it overrides it.

## Why This Matters

This is similar to default interface methods or extension methods. The concept
does not only say what must exist; it can also provide behavior derivable from
the required operations.

That keeps common algorithmic conveniences near the contract that justifies
them.
