# Compress Cursor Preconditions Into Debug Parts

Preconditions now mostly act as guard rails: they decide when to reject a public
operation, but delegate the actual policy to named debug members on cursor
parts.

## The Small Hook

The public operation keeps only the rejection hook:

```js
static [Preconditions] = {
  stepBack() {
    if (!this.canStepBack$())
      throwMoveOutOfBounds()
  },
}
```

The policy moves onto the part or concrete cursor where it can be named, reused,
and specialized:

```js
canStepBack$() {
  return !this.isAtBegin$()
}
```

This keeps the remaining procedural logic in `Preconditions` small enough to
inspect at a glance. If a `Preconditions` body grows again, that should now stand
out as a design smell.

## Public Contract

Cursor parts publish their public capability with `Implements`:

```js
export class BidirectionalCursorPart extends PartialClass {
  static [Implements] = BidirectionalCursorConcept
}
```

That keeps concepts focused on public capability surfaces:

```js
export class BidirectionalCursorConcept extends ForwardCursorConcept {
  stepBack() { }
}
```

## Helper Contract

`DependsOn` is reserved for helper dependencies between parts:

```js
export class OffsetReadableCursorPart extends PartialClass {
  static [Implements] = OffsetReadableCursorConcept

  static [DependsOn] = [
    InputCursorPart,        // isAccessible$
    RandomAccessCursorPart, // canMove$
  ]
}
```

That distinction matters because `DependsOn` asserts that a helper surface is
present without copying descriptors. This lets parts be split apart without
inheritance clobbering concrete cursor specializations with default debug
helpers.

## Design Grammar

- `Concept`: public capability surface.
- `Part`: reusable implementation and debug predicates.
- `Implements`: publish the public concept supplied by a part.
- `DependsOn`: require helper members from another part without copying them.
- `Preconditions`: tiny rejection hooks that delegate to named checks.

## Loader Support

The loader work supports this shape by enforcing `DependsOn` during partial
copies, copying base partial descriptors before derived ones, and preserving
concrete base members when a derived partial class declares an abstract override.

The tests cover cursor precondition behavior, dependency enforcement, and the
abstract override case that exposed the bottom-up copy requirement.
