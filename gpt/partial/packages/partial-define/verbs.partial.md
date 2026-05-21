# Verb: define

## Purpose

`define` is the lightest descriptor-copying verb.

It says: copy these members onto the type, but do not record a named partial
composition relationship.

## Local Style

```js
define(MyType, {
  helper() { }
})
```

## When To Use

Use `define` when the descriptor group is transparent and local.

If the descriptor group deserves a name, use a `PartialClass`.
