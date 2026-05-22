# Partial Shape Design

## Starting Point

After `Shape` was demoted to `Probe`, the word `Shape` became available for the
stronger abstraction we actually wanted from the STL mapping.

The old observational shape work became:

```txt
@kingjs/probe
└─ Probe
└─ wild-value observation
```

The new `@kingjs/partial-shape` should be:

```txt
@kingjs/partial-shape
└─ Shape
└─ structural requirement over constructor types
```

## Basis

The basis is STL named concepts.

In C++, `std::forward_iterator<I>` is not an interface and not a base class.
It is a named compile-time predicate. The compiler checks whether expressions
and associated types are valid for `I`.

```cpp
template<class I>
concept forward_iterator =
  input_iterator<I> &&
  incrementable<I> &&
  sentinel_for<I, I>;
```

The JavaScript translation is:

```txt
STL compiler probing
└─ checks whether expressions compile for a type

Shape
└─ checks whether descriptors bind for a type/prototype

Probe
└─ checks whether a live value appears to support an operation
```

So `Shape` is more faithful to STL than `Concept`.

## Concept vs Shape vs Probe

```txt
Concept
└─ PartialType
└─ nominal/public capability
└─ explicitly composed into a type
└─ appears in the meta-prototype chain
└─ "this type declares it implements X"

Shape
└─ PartialType
└─ structural requirement over constructor types
└─ compiles abstract descriptors like Concept
└─ can include other Shapes
└─ cached by tested type
└─ does not become part of nominal type identity
└─ "this type satisfies X"

Probe
└─ Metadata
└─ observational check over wild JavaScript values
└─ may invoke getters or proxy traps
└─ "this value appears to have X right now"
```

## Declaration

`Shape` should extend `PartialType`, not `Metadata`, because it wants the
partial declaration machinery:

```js
export class ForwardCursorShape extends Shape {
  step() { }
  clone() { }
}
```

Like `Concept`, shape members should compile to abstract descriptors. Unlike
`Concept`, `instanceof Shape` should not ask whether a type was composed with
the shape.

It should ask whether the candidate's constructor structurally satisfies the
shape:

```js
cursor instanceof ForwardCursorShape
```

means:

```txt
Can PartialReflect prove that cursor.constructor.prototype satisfies the
abstract descriptor surface declared by ForwardCursorShape?
```

## Composition

Shapes should be able to form a poset of other shapes.

The adjacency symbol should be unique to shapes:

```js
export const Includes = Symbol('Includes')
```

Example:

```js
export class WritableRandomAccessCursorShape extends Shape {
  static [Includes] = [
    RandomAccessCursorShape,
    OutputCursorShape,
  ]

  setAt(offset, value) { }
}
```

The word `Includes` reads better than `DependsOn` here. A shape is not saying
that another shape must have already been copied to a host. It is saying that
its structural requirement includes the structural requirements of other shapes.

## Query API

The public query is ordinary `instanceof`:

```js
cursor instanceof RandomAccessCursorShape
```

That reads as:

```txt
Does this cursor's constructor prototype satisfy this shape?
```

`Probe` hits live objects. `Shape` hits constructor prototypes. That is what
makes the result cacheable.

## Runtime Matching

`Shape[Symbol.hasInstance]` uses `PartialReflect` as its reflection policy.
That preserves the partial descriptor binding semantics already used by
`Concept`.

Sketch:

```js
export class Shape extends PartialType {
  static [Adjacent] = {
    [Includes]: Shape,
  }

  static [Compile](descriptor) {
    descriptor = super[Compile](descriptor)
    return abstractify(descriptor)
  }

  static [Symbol.hasInstance](instance) {
    if (this == Shape)
      return false

    if (instance == null)
      return false

    const type = instance.constructor

    if (typeof type != 'function')
      return false

    return isMatch(this, type)
  }
}
```

The structural match should be cached:

```txt
WeakMap<Shape, WeakMap<Type, boolean>>
```

Positive and negative results should both be cached. Normal programs query a
small number of shape/type pairs, and weak keys avoid retaining dead types.

The cache should only cache the descriptor satisfaction result. It should not
publish reflection metadata or mutate the type.

## Decisions

- `Shape[Symbol.hasInstance]` accepts instances, then checks the instance's
  constructor type against cached structural descriptor results.
- `Probe` owns value-level runtime observation.
- `Shape` owns type-level descriptor satisfaction.
- The satisfaction cache stores positive and negative results.
- `Includes` accepts only other Shapes.
- Shape satisfaction is descriptor-only and must not invoke runtime getters or
  proxy traps.
- Shape matching should use strict descriptor checking, like the compiler basis.
- Shape copies descriptors like `Concept`.
- Default helper members are not part of Shape; Shape should stay like
  `Concept`.
- `Shape` remains the STL-ish compile-time probing analog.
- `Probe` remains the runtime checking analog forever.

## First Target

Cursor/range names that currently look STL-shaped but are implemented as
nominal concepts are the first candidates:

```txt
ForwardCursorConcept
RandomAccessCursorConcept
ForwardRangeConcept
RandomAccessRangeConcept
```

Those may eventually become, or be mirrored by:

```txt
ForwardCursorShape
RandomAccessCursorShape
ForwardRangeShape
RandomAccessRangeShape
```

The goal is not to delete `Concept`, but to stop using `Concept` for things
whose basis is really STL structural predicates.

## First Implementation

The first implementation added `@kingjs/partial-shape` with:

```txt
Shape
└─ PartialType
└─ static [Includes] adjacency to other Shapes
└─ abstract descriptor compilation like Concept
└─ Symbol.hasInstance queries instance.constructor satisfaction

structural query
└─ checks a constructor prototype against a Shape after descriptor validation
└─ caches positive and negative descriptor results
```

`Includes` was added to `partial-symbols` and hidden from ordinary
`PartialReflect` static reflection as known metadata.

## Implementation Correction

The first implementation was corrected so `satisfy` is not merely a cache-only
declaration. It is the structural sibling of `implement`.

```txt
implement(type, concept)
└─ copies Concept descriptors onto a type
└─ publishes the Concept as nominal composition

instance instanceof Shape
└─ asks whether instance.constructor.prototype strictly matches Shape
└─ caches positive and negative descriptor matches
```

The copy-verb experiment required a finer `Transparent` rule in the loader:

```txt
transparent same family
└─ adjoins as a real node

transparent different family
└─ flattens into the host descriptor surface
```

`Shape[Symbol.hasInstance]` is now a structural descriptor query over
`instance.constructor.prototype`. The separate `partial-satisfy` package was
later removed; current shape satisfaction is the cached structural query.

The fuller implementation note is
[Partial Shape and Satisfy](./2026-05-20-004-partial-shape-and-satisfy.notes.md).
