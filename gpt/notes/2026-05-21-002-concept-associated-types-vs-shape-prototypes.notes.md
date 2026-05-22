# Concept Associated Types vs Shape Prototypes

## Question

If range capability is really a predicate over a range and its cursor, should
range categories be concepts at all?

The emerging answer is no. `RangeShape` describes the direct range surface.
The cursor category is derived by small predicate functions that look at the
range cursor type's prototype.

## Current Landing

The implementation deletes the old `InputRangeConcept`,
`ForwardRangeConcept`, `RandomAccessRangeConcept`, and related ladder.
`RangeConcept` remains as the direct nominal range declaration. Range
categories now live as predicate/probe types:

```js
export function isRange(range) {
  return range instanceof RangeShape
}

export function isRandomAccessRange(range) {
  return isBidirectionalRange(range) &&
    range.cursorType.prototype instanceof RandomAccessCursorShape
}
```

That means declarations publish the range mechanics once, while callsites that
ask capability questions go through the STL-ish predicate/probe path.

```txt
RangeShape
|_ structural requirement and helper publication
|_ used by isRange and RangeProbe
|_ declares begin/end/cursorType

RandomAccessRangeProbe
|_ asks isRandomAccessRange(range)
   |_ range instanceof RangeShape
   |_ range.cursorType.prototype instanceof RandomAccessCursorShape
```

`RangeShape` now lives in `@kingjs/cursor-shape` beside the cursor shapes.
`RangeConcept` remains in `@kingjs/cursor` as the nominal direct range
declaration.

Concrete ranges now expose the range surface directly:

```js
begin() { return new this.cursorType(this, 0) }
end() { return new this.cursorType(this, this.size) }
```

If a range needs a custom cursor type, provide it directly on the `RangeShape`
surface so the local associated-result policy wins over the default helper:

```js
get cursorType() { return this._first.constructor }
begin() { return this._first.clone?.() ?? this._first }
end() { return this._last.clone?.() ?? this._last }
```

## Direct Range Shape

`RangeShape` describes what the range itself must expose:

```js
export class RangeShape extends Shape {
  begin() { }
  end() { }

  get cursorType() { }
}
```

`InputRange` is then not:

```txt
range has static cursorType
```

It is:

```txt
range has a cursor type
└─ whose prototype satisfies InputCursorShape
```

## Predicate Translation

```js
export class InputCursorShape extends Shape {
  step() { }
  get value() { }
}

export function cursorPrototypeOf(range) {
  return range.cursorType?.prototype
}

export function isReadableRange(range) {
  if (!(range instanceof RangeShape))
    return false

  return cursorPrototypeOf(range) instanceof InputCursorShape
}
```

Then a metadata wrapper can keep the same simple checking spine:

```js
export class ReadableRangeRequirement {
  static [Symbol.hasInstance](range) {
    return isReadableRange(range)
  }
}
```

```txt
value instanceof RequirementType
```

## Concrete Implementation

A container can still use `cursorType` internally if that is the most convenient
way to implement the range surface:

```js
export class Deque extends PartialProxy {
  static cursorType = IndexableCursor

  get cursorType() { return this.constructor.cursorType }
  begin() { return new this.constructor.cursorType(this, 0) }
  end() { return new this.constructor.cursorType(this, this.size) }
}
```

`cursorType` is part of the structural range requirement because range probes
ask cursor-shape questions of `range.cursorType.prototype`.

## STL Mapping

```cpp
std::ranges::input_range<R>
```

becomes:

```js
isReadableRange(range)
```

implemented as:

```txt
range instanceof RangeShape
└─ cursorPrototypeOf(range) instanceof InputCursorShape
```

And:

```cpp
std::ranges::iterator_t<R>
```

becomes:

```js
cursorPrototypeOf(range)
```

## No Range Ladder

A major advantage is avoiding a concrete `XXXRange` ladder.

Without this split, every cursor capability tends to imply another range type:

```txt
InputRange
ForwardRange
BidirectionalRange
RandomAccessRange
ContiguousRange
```

Each type risks duplicating the same `begin/end` surface while only changing
what is true about its cursor.

With `cursorType`, the range surface stays small:

```txt
RangeShape
└─ begin
└─ end
└─ cursorType
```

The richer range categories become predicates:

```txt
isReadableRange(range)
isForwardRange(range)
isRandomAccessRange(range)
```

That is closer to STL, where `std::ranges::random_access_range<R>` is a
predicate over `R` and `iterator_t<R>`, not a runtime base class.

## Convention

```txt
Shape
└─ required observable surface

associated extraction helper
└─ named function that pulls a result descriptor from that surface

concrete type
└─ may use static metadata internally to implement the surface
```

This keeps Shape focused on structure, while associated-result logic lives in
small named predicates that can be ported mechanically from STL.

## Larger Payoff

This convention scales toward a future Boost Graph Library style port:

```txt
graph_traits<G>::vertex_iterator
└─ prototypeVertexCursorOf(graph)

boost::incidence_graph<G>
└─ isIncidenceGraph(graph)
   ├─ graph instanceof GraphShape
   └─ prototypeOutEdgeCursorOf(graph) instanceof ForwardCursorShape
```

The same pattern can translate graph traits, iterator categories, and concept
predicates without forcing every derived capability into a class ladder.

## 2026-05-22 Update

The package boundary moved after this note. `RangeConcept` remains in
`@kingjs/cursor` as the nominal direct range declaration. `RangeShape` and the
range probe vocabulary moved to `@kingjs/cursor-shape` beside the cursor
shapes, so algorithms can ask STL-ish structural questions without making
`@kingjs/cursor` depend on shape/testing vocabulary.

## Related

- [STL Mechanical Translation](./2026-05-21-001-stl-mechanical-translation.notes.md)
