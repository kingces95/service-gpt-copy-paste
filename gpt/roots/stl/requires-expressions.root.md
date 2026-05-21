# Requires Expressions

## Original Idea

C++20 lets templates constrain type parameters with named concepts or anonymous
`requires` expressions.

Anonymous expression constraint:

```cpp
template<class C, class Value>
requires requires(C c, Value value) {
  c.push_back(value);
}
void append(C& container, Value value) {
  container.push_back(value);
}
```

Named concept:

```cpp
template<class C, class Value>
concept PushBackable = requires(C c, Value value) {
  c.push_back(value);
};

template<class C, class Value>
requires PushBackable<C, Value>
void append(C& container, Value value) {
  container.push_back(value);
}
```

The anonymous form is useful for one-off constraints. The named form is useful
when the requirement becomes vocabulary.

## Local Vocabulary

The current naming direction separates three nearby ideas:

```text
Concept
  named, certified, opt-in semantic vocabulary

Shape
  anonymous-concept-style expression requirement

Probe
  observational duck test for wild JavaScript values
```

This makes `Shape` the close local analog to a small C++ `requires` expression:
it can name a tiny surface like "has `push(value)`" without requiring the
candidate type to explicitly implement a grand public concept.

`Probe` gets the old observational role: inspect a messy runtime value and ask
whether it appears to satisfy a surface, even if that requires getters, proxy
traps, or other live JavaScript observations.

## Probes as Runtime Requires Expressions

C++ `requires` expressions are source code that looks executable, but in that
context the expressions are checked rather than run:

```cpp
template<class R>
concept random_access_range =
  range<R> &&
  random_access_iterator<iterator_t<R>>;
```

The compiler extracts the iterator type from `ranges::begin(r)` and checks
whether expressions over that iterator are valid. The expression tree is acting
like compile-time metadata: ordinary-looking code used as structured data for
overload selection and template validation.

JavaScript cannot ask the compiler whether `range.begin()` returns a
random-access cursor. The local runtime translation is therefore:

```text
Raw expression check
└─ named predicate function
   └─ Probe type wrapping Symbol.hasInstance
      └─ declarative metadata can refer to the type
```

Example:

```js
export function isRandomAccessRange(range) {
  return isRange(range) &&
    cursorOf(range) instanceof RandomAccessCursorConcept
}

export class RandomAccessRangeProbe {
  static [Symbol.hasInstance](range) {
    return isRandomAccessRange(range)
  }
}
```

Then declarations can stay metadata-shaped:

```js
ReversedSubrange: {
  range(source) {
    return subrange(source.end(), source.begin())
  },
  expected: -3,
  requires: RandomAccessRangeProbe,
}
```

This is not claiming that a range type explicitly implements a
`RandomAccessRangeConcept`. It is a runtime probe that does what STL does at
compile time: dig through `begin`, derive the cursor capability, and answer a
named predicate. The type wrapper exists so the declarative testing and
contract systems can point at a reflectable value instead of embedding an
inline function.

This also explains why a ladder of `SubrangeView` specializations is not the
right first move. C++ does not build separate subrange classes for every range
concept; it computes named predicates from the iterator type. The JS analog is
to compute named probes from the runtime cursor object, optionally using a
static `cursorType` associated type as a cache or declaration hint when a
concrete range has one.

The local range vocabulary now has a more precise hook for this:
`prototypeCursor`. It is the representative cursor used for cursor-concept
queries:

```js
range.prototypeCursor instanceof RandomAccessCursorConcept
```

For concrete containers, `prototypeCursor` can be derived cheaply from
`static cursorType`:

```js
get prototypeCursor() {
  return this.constructor.cursorType?.prototype ?? this.begin()
}
```

For instance-shaped views such as `subrange(first, last)`, the view can
implement the same concept member by returning the captured cursor:

```js
get prototypeCursor() {
  return this._first
}
```

This is the runtime JS analog of `iterator_t<R>`: not necessarily a type, but
the prototype-style representative that makes `instanceof CursorConcept`
queries possible without manufacturing a specialized `SubrangeViewOf<TCursor>`
type.

## Local Translation

The local translation is function contract metadata that holds types. The
loader stays deliberately boring:

```js
value instanceof type
```

Anonymous expression checks can still exist, but they are wrapped behind a type
surface with `Symbol.hasInstance` instead of being a special procedural branch
inside `contract`.

The preferred declaration shape puts metadata before the function, closer to
C# custom attributes visually appearing above a member. Use a metadata POJO
with symbol keys so the shape can grow without making `contract(...)` depend on
positional arguments.

Anonymous expression check wrapped as a type:

```js
class PushBackContainer {
  static [Symbol.hasInstance](type) {
    if (typeof type?.prototype?.push == 'function')
      return true

    throw new TypeError(
      `${type?.name ?? 'Type'} must define push(value).`)
  }
}

export const materialize = contract(
  [
    null,
    PushBackContainer,
  ],
  [
    null,
    VectorMap,
  ],
  function materialize(range, type = VectorMap) {
  // ...
  })
```

Named check:

```js
export class PushBackContainer {
  static [Symbol.hasInstance](type) {
    if (typeof type?.prototype?.push == 'function')
      return true

    throw new TypeError(
      `${type?.name ?? 'Type'} must define push(value).`)
  }
}

export const materialize = contract(
  [
    null,
    [
      DefaultConstructible,
      PushBackContainer,
    ],
  ],
  [
    null,
    VectorMap,
  ],
  function materialize(range, type = VectorMap) {
  const result = new type()
  const first = range.begin()
  const last = range.end()

  while (!first.equals(last)) {
    result.push(first.value)
    first.step()
  }

  return result
  })
```

Ordinary types in the metadata use existing `instanceof` semantics. Custom
expression-style validation and better errors are still possible by defining
`Symbol.hasInstance`.

The explicit `[Defaults]` metadata exists because a wrapper can intercept call
arguments but cannot reliably reflect JavaScript default parameter expressions.
Keeping defaults in metadata makes the precondition phase see the same argument
defaults that the function body will see.

## Why It Matters

This maps C++'s expression constraints to runtime-reflectable JavaScript
metadata. The runtime check is not hoisted out of the code path like C++, but it
is hoisted out of the algorithm body and into declarative metadata.

The metadata-first wrapper also carries a C# custom-attribute influence:

```text
[Preconditions(...)]
[Defaults(...)]
function materialize(...) { ... }
```

becomes:

```js
contract({
  [Preconditions]: ...,
  [Defaults]: ...,
}, function materialize(...) { ... })
```

The path mirrors the preferred evolution:

```text
anonymous local expression
  -> named instanceof type
  -> reusable restriction/facet
  -> public concept, if it earns the weight
```
