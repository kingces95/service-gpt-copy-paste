# Mixin

Mixins with a paper trail.

Turn prototype-copying mixins into named, reflectable implementation parts.

## The JavaScript Idiom

A common JavaScript mixin copies members from one object to another.

```js
const FrontInsertable = {
  get front() { return this.at(0) },
  pushFront(value) { this.insertValue(this.begin(), value) },
  popFront() {
    const cursor = this.begin()
    const value = cursor.value
    this.erase(cursor)
    return value
  },
}

Object.assign(Vector.prototype, FrontInsertable)
```

This is compact, but the composition relationship disappears. Later reflection
sees the methods, not the reason they arrived.

## Declarative Translation

Use a `PartialClass` as a named implementation part.

```js
class FrontInsertableContainerPart extends PartialClass {
  static [Abstracts] = {
    get front() { },
    pushFront(value) { },
    popFront() { },
  }
}
```

Then extend it into another part or concrete type:

```js
class EditableContainerPart extends PartialClass {
  static {
    extend(this, FrontInsertableContainerPart, {
      pushFront(value) { this.insertValue(this.begin(), value) },
      popFront() {
        const cursor = this.begin()
        const value = cursor.value
        this.erase(cursor)
        return value
      },
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
      insertValue(cursor, value) { this.array.splice(cursor.index, 0, value) },
      erase(cursor) { this.array.splice(cursor.index, 1) },
    })
  }
}
```

The composed methods now read like native container methods:

```js
const values = new VectorMap([1, 2])

values.pushFront(0)
values.front // 0
values.popFront() // 0
```

## Why This Matters

The composed type can still be inspected as being made of
`FrontInsertableContainerPart`. That makes mixin-style reuse visible to docs,
tests, and future loaders.

The implementation stays small, but the architecture remains legible.
