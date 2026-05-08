# Mixin

Mixins with a paper trail.

Turn prototype-copying mixins into named, reflectable implementation parts.

## The JavaScript Idiom

A common JavaScript mixin copies members from one object to another.

```js
const FrontEditable = {
  get front() { return this.at(0) },
  unshift(value) { this.insertAt(value, this.begin()) },
  shift() { return this.take(this.begin()) },
}

Object.assign(Vector.prototype, FrontEditable)
```

This is compact, but the composition relationship disappears. Later reflection
sees the methods, not the reason they arrived.

## Declarative Translation

Use a `PartialClass` as a named implementation part.

```js
class FrontEditableContainerPart extends PartialClass {
  static [Abstracts] = {
    get front() { },
    unshift(value) { },
    shift() { },
  }
}
```

Then extend it into another part or concrete type:

```js
class EditableContainerPart extends PartialClass {
  static {
    extend(this, FrontEditableContainerPart, {
      unshift(value) { this.insertAt(value, this.begin()) },
      shift() { return this.take(this.begin()) },
    })
  }
}
```

A concrete container supplies the primitive edit operations:

```js
class VectorMap extends PartialProxy {
  static {
    extend(this, EditableContainerPart, {
      get front() { return this.at(0) },
      insertAt(value, cursor) { this.array.splice(cursor.index, 0, value) },
      take(cursor) { return this.array.splice(cursor.index, 1)[0] },
    })
  }
}
```

The composed methods now read like native container methods:

```js
const values = new VectorMap([1, 2])

values.unshift(0)
values.front // 0
values.shift() // 0
```

## Why This Matters

The composed type can still be inspected as being made of
`FrontEditableContainerPart`. That makes mixin-style reuse visible to docs,
tests, and future loaders.

The implementation stays small, but the architecture remains legible.
