# Requires Expression

If the function needs a capability, say so before it runs.

Inline checks are useful, but they read like defensive code. A requires-style
contract makes the capability test part of the declaration, closer to C++20
constraints translated into runtime JavaScript.

## The JavaScript Idiom

A function checks for the operations it plans to use.

```js
function create(Type) {
  const result = new Type()

  if (typeof result.push != 'function')
    throw new TypeError('Expected push.')

  return result
}
```

The rule is real, but it is mixed into the algorithm body.

## Declarative Translation

Use named checks for common constraints and inline checks for local ones.

```js
class PushBackContainer extends Check {
  static check(Type) {
    const instance = new Type()
    if (typeof instance.push == 'function') return
    throw new TypeError('Type must create a push-back container.')
  }
}

const create = contract([
  [DefaultConstructible, PushBackContainer],
], function create(Type) {
  return new Type()
})
```

Or keep a one-off expression anonymous:

```js
const create = contract([[
  Type => {
    if (typeof new Type().push == 'function') return
    throw new TypeError('Type must support push.')
  },
]], function create(Type) {
  return new Type()
})
```

## Why This Matters

The algorithm body becomes the algorithm again. The capability test moves into
a procedural metadata block that can later be named, documented, reused, or
reported with a better error.

That is the me-ish translation of C++ constraints: anonymous when local, named
when the idea becomes a reusable concept.

## Lineage

C++20 `requires` expressions let templates state the operations they need.

```cpp
requires(C c) {
  c.push_back(value);
}
```

The JavaScript translation keeps the expression check, but moves it into
runtime metadata:

```js
Type => {
  if (typeof new Type().push == 'function') return
  throw new TypeError('Type must support push.')
}
```

That makes the check executable, documentable, and capable of throwing a good
runtime error.
