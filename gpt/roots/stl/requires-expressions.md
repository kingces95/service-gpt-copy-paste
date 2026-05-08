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

## Local Translation

The local translation is function contract metadata that can hold both
anonymous procedural checks and named `Check` types.

The preferred declaration shape puts metadata before the function, closer to
C# custom attributes visually appearing above a member. Use a metadata POJO
with symbol keys so the shape can grow without making `contract(...)` depend on
positional arguments.

Anonymous procedural check:

```js
function hasPush(Type) {
  if (typeof Type?.prototype?.push == 'function') return
  throw new TypeError(`${Type?.name ?? 'Type'} must define push(value).`)
}

export const materialize = contract({
  [Preconditions]: [
    null,
    null,
    hasPush,
  ],
  [Defaults]: [
    null,
    null,
    VectorMap,
  ],
}, function materialize(first, last, Type = VectorMap) {
  // ...
})
```

Named check:

```js
export class PushBackContainer extends Check {
  static check(Type) {
    if (typeof Type?.prototype?.push == 'function') return
    throw new TypeError(`${Type?.name ?? 'Type'} must define push(value).`)
  }
}

export const materialize = contract({
  [Preconditions]: [
    null,
    null,
    [
      DefaultConstructible,
      PushBackContainer,
    ],
  ],
  [Defaults]: [
    null,
    null,
    VectorMap,
  ],
}, function materialize(first, last, Type = VectorMap) {
  const result = new Type()

  if (first.clone)
    first = first.clone()

  while (!first.equals(last)) {
    result.push(first.value)
    first.step()
  }

  return result
})
```

Ordinary types in the metadata can use existing `instanceof` semantics, while
`Check` types provide custom expression-style validation and better errors.

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
anonymous local check
  -> named Check type
  -> reusable restriction/facet
  -> public concept, if it earns the weight
```
