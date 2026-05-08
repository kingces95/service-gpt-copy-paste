# Associated Type

Some relationships are part of the type, not part of the constructor body.

When a class always travels with a related type, the relationship deserves a
name and a reflection story. This is the JavaScript version of saying "this
range has this cursor type" without burying it in convention.

## The JavaScript Idiom

A type relationship is often stored as an ordinary static or prototype field.

```js
class VectorRange {
  static Cursor = VectorCursor

  begin() {
    return new VectorRange.Cursor(this, 0)
  }
}
```

That is compact, but the relationship is just another field. Reflection cannot
tell whether it is a constant, a factory, a cache, or a meaningful associated
type.

## Declarative Translation

Declare the associated type as static metadata on the part.

```js
class RangePart extends PartialClass {
  static cursorType = VectorCursor
}

class VectorRange extends PartialProxy {
  static {
    extend(this, RangePart, {
      begin() { return new this.cursorType(this, 0) },
      end() { return new this.cursorType(this, this.size) },
    })
  }
}
```

The consuming code stays ordinary:

```js
const first = range.begin()
first instanceof range.cursorType // true
```

## Why This Matters

Associated types make family relationships visible. Containers, cursors,
views, records, parsers, and command types can advertise the types they expect
to cooperate with.

That is a small move with a big documentation payoff: the architecture can be
read from declarations instead of inferred from constructor calls.

The important twist is that the partial metadata chain can find static
declarations contributed by parts. A relationship declared on `RangePart` can
still be discovered while reflecting `VectorRange`.

## Lineage

STL uses associated types to let generic code ask an iterator or range what
other types belong to it.

```cpp
typename iterator_traits<I>::value_type
```

This project translates that familiar move into runtime JavaScript metadata:

```js
class RangePart extends PartialClass {
  static cursorType = VectorCursor
}
```
