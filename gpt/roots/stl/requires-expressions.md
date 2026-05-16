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
    null,
    PushBackContainer,
  ],
  [
    null,
    null,
    VectorMap,
  ],
  function materialize(first, last, type = VectorMap) {
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
    null,
    [
      DefaultConstructible,
      PushBackContainer,
    ],
  ],
  [
    null,
    null,
    VectorMap,
  ],
  function materialize(first, last, type = VectorMap) {
  const result = new type()

  if (first.clone)
    first = first.clone()

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
