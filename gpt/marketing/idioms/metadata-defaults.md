# Metadata Defaults

Wrappers should see the same defaults callers get.

Default parameters are ergonomic until a wrapper needs to validate or document
the final argument list. Making defaults explicit metadata lets the contract
layer apply them before checks run.

## The JavaScript Idiom

JavaScript default parameters live inside the function call mechanics.

```js
function materialize(first, last, Type = VectorMap) {
  const result = new Type()
  // ...
  return result
}
```

A wrapper can intercept `first`, `last`, and maybe `Type`, but it cannot
reflect the default expression in a reliable runtime way.

## Declarative Translation

Declare defaults beside the function contract.

```js
const materialize = contract({
  [Defaults]: [null, null, VectorMap],
  [Preconditions]: [
    InputCursorConcept,
    InputCursorConcept,
    [DefaultConstructible, PushBackContainer],
  ],
}, function materialize(first, last, Type) {
  const result = new Type()

  while (!first.equals(last)) {
    result.push(first.value)
    first.step()
  }

  return result
})
```

The call site stays pleasant:

```js
const buffered = materialize(first, last)
```

The contract layer still validates the actual `Type` that will be used.

## Why This Matters

This turns a wrapper blind spot into declared behavior. Defaults become part of
the reflectable function surface, so validation, help text, and documentation
can agree with execution.

It is especially useful for library functions where the ergonomics of optional
arguments should not erase the precision of preconditions.

## Lineage

This borrows the feel of C# custom attributes: contract metadata appears beside
the function instead of being rediscovered from the function body.

```csharp
[DefaultValue(typeof(VectorMap))]
void Materialize(...)
```

The JavaScript translation keeps defaults in metadata the wrapper can see:

```js
contract({
  [Defaults]: [null, null, VectorMap],
}, function materialize(first, last, Type) {
  // ...
})
```
