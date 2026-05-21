# Runtime Duck Check

If it quacks, write down which duck you meant.

Turn one-off `typeof` probes into reusable probe or check metadata.

## The JavaScript Idiom

Plain JavaScript often checks structure inline:

```js
function useThenable(value) {
  if (!value || typeof value.then != 'function')
    throw new TypeError('Expected thenable.')

  return Promise.resolve(value)
}
```

The check is useful but local. It cannot easily be reused or documented.

## Declarative Translation

For wild external values, use a `Probe`.

```js
class ThenableProbe extends Probe {
  then() { }
}

if (!(value instanceof ThenableProbe))
  throw new TypeError('Expected thenable.')
```

For function arguments, use a named `Check`.

```js
class ThenableValue extends Check {
  static check(value) {
    if (value && typeof value.then == 'function') return
    throw new TypeError('Expected thenable.')
  }
}

load[Preconditions] = [
  ThenableValue,
]
```

## Why This Matters

Probes and checks make runtime assumptions reusable and documentable.

Use `Probe` when the object is wild JS and observational duck typing is the
right model. Use `Check` when the validation is part of function metadata and
needs a good error message.

Use `Shape` for type-level structural requirements copied by `satisfy`, not
for wild runtime values.
