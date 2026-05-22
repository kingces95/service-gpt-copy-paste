# STL Mechanical Translation

## Goal

Prefer a near-mechanical conversion from STL concepts into KingJS runtime
features.

The design target is not originality. The target is a small translation grammar
that lets an STL declaration point almost directly at the JavaScript feature
that should carry the same idea.

```txt
STL named concept
└─ mechanical JS translation
   └─ Shape / predicate / associated metadata pattern
```

## Translation Table

```txt
C++20 / STL                         KingJS translation
------------------------------------------------------
requires expression                 Shape descriptor check
named concept over one type         Shape
concept composition                 static [Includes] = [...]
std::input_iterator<I>              I.prototype instanceof InputCursorShape
std::ranges::range<R>               range instanceof RangeShape
std::ranges::iterator_t<R>          cursorPrototypeOf(range)
associated type extraction          helper like cursorPrototypeOf(range)
concept with associated extraction  predicate function
compile-time predicate              cached runtime predicate
concept used in metadata            wrapper type with Symbol.hasInstance
```

## Single-Type Concepts

An STL concept over one structural type maps cleanly to `Shape`.

```cpp
template<class I>
concept input_iterator =
  /* can increment */ &&
  /* can read */;
```

KingJS translation:

```js
export class InputCursorShape extends Shape {
  step() { }
  get value() { }
}
```

Use:

```js
cursor instanceof InputCursorShape
```

This asks whether the cursor's constructor prototype structurally satisfies the
descriptor surface.

## Concept Composition

STL concepts often compose other concepts.

```cpp
template<class I>
concept bidirectional_iterator =
  forward_iterator<I> &&
  /* can decrement */;
```

KingJS translation:

```js
export class BidirectionalCursorShape extends Shape {
  static [Includes] = [ ForwardCursorShape ]

  stepBack() { }
}
```

`Includes` preserves the source idea: this requirement includes another
requirement. It is not nominal inheritance on the tested type.

The cursor-shape pass settled on a flat-ish translation even when the STL names
form a strong conceptual ladder. Keep the STL names because they carry the
right lineage, but encode implication with `Includes`:

```js
export class ForwardCursorShape extends Shape {
  static [Includes] = InputCursorShape

  clone() { }
}

export class BidirectionalCursorShape extends Shape {
  static [Includes] = ForwardCursorShape

  stepBack() { }
}

export class RandomAccessCursorShape extends Shape {
  static [Includes] = BidirectionalCursorShape

  move(offset) { }
  compareTo(other) { }
  distanceTo(other) { }
}
```

So the requirement graph is:

```txt
CursorShape

InputCursorShape
└─ includes CursorShape

OutputCursorShape
└─ includes CursorShape

ForwardCursorShape
└─ includes InputCursorShape

BidirectionalCursorShape
└─ includes ForwardCursorShape

RandomAccessCursorShape
├─ includes BidirectionalCursorShape
└─ implements ReadableAtCursorConcept

ContiguousCursorShape
└─ includes RandomAccessCursorShape

WritableRandomAccessCursorShape
├─ includes OutputCursorShape
└─ includes RandomAccessCursorShape

WritableContiguousCursorShape
├─ includes ContiguousCursorShape
└─ includes WritableRandomAccessCursorShape
```This keeps the legacy STL associations while avoiding nominal inheritance as
the mechanism. Inheritance is no longer doing semantic work for cursor shapes;
`Includes` is.

Implementation sites may still smear an aggregate shape into smaller facets.
For example, a mutable cursor can expose read and write separately:

```js
static {
  implement(this, ReadableCursorConcept, {
    get value() { return this.at(0) },
  })
}

static {
  implement(this, WritableCursorConcept, {
    set value(value) { this.setAt(0, value) },
  })
}
```

Those declarations give the concrete cursor the members that
`InputCursorShape` and `OutputCursorShape` later observe structurally.

## Associated Type Extraction

STL range concepts often extract an iterator type and then test that extracted
type.

```cpp
template<class R>
concept random_access_range =
  range<R> &&
  random_access_iterator<iterator_t<R>>;
```

The faithful runtime translation is a predicate, not necessarily another
direct `Shape`.

```js
export function isRandomAccessRange(range) {
  return range instanceof RangeShape &&
    range.cursorType.prototype instanceof RandomAccessCursorShape
}
```

The mechanical mapping is:

```txt
iterator_t<R>
└─ cursorPrototypeOf(range)

random_access_iterator<I>
└─ cursor prototype instanceof RandomAccessCursorShape

random_access_range<R>
└─ isRandomAccessRange(range)
```

The names matter because STL is talking about types while KingJS often has a
runtime object. There are two useful JS views:

```txt
I as constructor type
└─ I.prototype instanceof RandomAccessCursorShape

I as prototype/sample cursor
└─ I instanceof RandomAccessCursorShape
```

For ranges, the range instance exposes a cursor type describing what `begin()`
and `end()` produce:

```js
function cursorPrototypeOf(range) {
  return range.cursorType?.prototype
}
```

That makes `cursorType` an associated-result descriptor:

```txt
range
└─ begin() produces real cursors
└─ cursorType.prototype describes those cursors without allocating or moving one
```

This mirrors JavaScript's own split between a constructor and its prototype:

```txt
CursorType
└─ CursorType.prototype describes cursor instances

range
└─ range.cursorType.prototype describes cursor results
```

So the expanded range check reads:

```js
export function isRandomAccessRange(range) {
  if (!(range instanceof RangeShape))
    return false

  const cursor = cursorPrototypeOf(range)

  return cursor instanceof RandomAccessCursorShape
}
```

If the extraction helper later needs policy, caching, or fallback behavior, the
mechanical translation still has a stable hook:

```txt
iterator_t<R>
└─ cursorPrototypeOf(range)
   ├─ use range.cursorType.prototype
   ├─ maybe fall back to range.begin()
   └─ maybe validate that the result is cursor-like
```

## Metadata Wrappers

If a predicate needs to appear in declarative metadata, wrap it.

```js
export class RandomAccessRangeRequirement {
  static [Symbol.hasInstance](range) {
    return isRandomAccessRange(range)
  }
}
```

The predicate remains the honest translation of the STL concept. The wrapper is
only the bridge into the metadata/checking system.

For example:

```js
static [ArgChecks] = {
  sort: [ RandomAccessRangeRequirement ],
}
```

There is no current `Check` base class here. That was an older sketch. The live
mechanism is still the simple backbone:

```txt
value instanceof RequirementType
```

## Design Rule

Do not force every STL concept into the same JavaScript artifact.

```txt
STL concept over one structural type
└─ Shape

STL concept that extracts associated types
└─ predicate function

STL concept used in metadata
└─ wrapper type with Symbol.hasInstance

STL associated type
└─ reflected property/helper
```

That keeps the mapping faithful while still giving the runtime system ordinary
JavaScript reflection points.

## Satisfaction Placement

The first cursor-shape pass confirmed an existing loader rule:

```txt
value instanceof Shape
└─ performs a cached strict descriptor query over value.constructor.prototype
```

Concrete members, own or inherited, should not be replaced by abstract Shape
members. This makes leaf satisfaction safe:

```txt
ContiguousCursor
└─ inherits random-access cursor members from IndexableCursor
└─ defines only contiguous members locally
└─ can be tested against ContiguousCursorShape
```

The current rule is:

```txt
Use `instanceof Shape` where the host should be tested structurally. Abstract
Shape members document requirements without whacking concrete code.
```

## Concrete vs Abstract Declarations

Shape declarations should stay focused on the structural surface. Concrete
behavior belongs in concepts, parts, containers, or views; shapes are the
STL-ish query vocabulary algorithms ask for.

## Related

- [Reframing STL Concepts as Shapes](./2026-05-20-002-stl-concepts-as-shapes.notes.md)
- [Partial Shape Design](./2026-05-20-003-partial-shape-design.notes.md)
- [Partial Shape and Satisfy](./2026-05-20-004-partial-shape-and-satisfy.notes.md)
- [Concept Associated Types vs Shape Prototypes](./2026-05-21-002-concept-associated-types-vs-shape-prototypes.notes.md)
