# Conditions

## Original Idea

Design by contract attaches preconditions and postconditions to operations.
C# attributes and AOP-style systems can wrap methods based on metadata.

## Local Model

Static condition metadata is collected from the composed partial metadata chain:

```js
static [Preconditions] = {
  step() {
    if (this.equals(this.range.end()))
      throwMoveOutOfBounds()
  }
}
```

`partial-metadata` turns condition objects into prototype-like chains so a
member can collect all applicable preconditions/postconditions from concepts,
partial classes, and concrete types.

`partial-proxy` then uses those collected conditions to create thunks.

## Why This Matters

Concepts can carry runtime safety rules. Concrete classes get those rules when
they implement the concept, without inlining every guard by hand.
