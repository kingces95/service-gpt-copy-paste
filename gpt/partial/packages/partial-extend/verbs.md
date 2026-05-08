# Verb: extend

## Purpose

`extend` composes a `PartialClass` into a target.

It says: this target is now built from this named implementation/capability
part.

## Local Style

```js
extend(VectorMap, PartialIndexableContainer)

extend(VectorMap, SizedContainerPart, {
  get size() { return this._array.length }
})
```

## When To Use

Use `extend` when the contributor is a named implementation part and should
appear in reflection as part of the target's composition.
