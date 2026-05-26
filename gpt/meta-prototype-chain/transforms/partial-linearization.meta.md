# Partial Linearization

Composition needs an order you can inspect.

The partial system lets a type acquire members by extension, declaration, and
procedure. The linearization transform turns that partial-type graph into a
single meta-prototype chain.

## Source

- `packages/partial-reflector/index.js`
- `packages/partial-class/unit.test.js`
- `packages/partial-implement/unit.test.js`

## The Pain

Mixin-style composition usually copies members and loses the explanation.

```js
Object.assign(MyType.prototype, Fubar)
Object.assign(MyType.prototype, Snafu)
```

After the copy, reflection can see `foo`, but it cannot tell whether `foo`
came from `Fubar`, `Snafu`, the host type, or a later override.

## The Transform

`PartialReflect` discovers adjacent partial types from:

- ES6 inheritance between user partial types
- declarative metadata like `[Extends]`, `[Implements]`, and `[Defines]`
- procedural calls such as `extend()` and `implement()`

Then it linearizes the graph:

```js
class Snafu extends PartialClass {
  get foo() { }
  get baz() { }
}

class Fubar extends PartialClass {
  get foo() { }
  get bar() { }
}

class SitRep extends Snafu {
  static [Extends] = Fubar
  get bar() { }
}

class MyType {
  static { extend(this, SitRep) }
}
```

```txt
M(T) = dedupLast(M(B) ++ M(P0) ++ M(P1) ++ ... ++ [T])
```

The resulting merge order is reduced into a meta-prototype chain.

```txt
Source composition tree:

MyType
└─ SitRep
   ├─ Fubar
   └─ Snafu

Transformed meta-prototype chain:

MyType
└─ SitRep
   └─ Fubar
      └─ Snafu
         └─ Object
```

## What It Describes

This chain describes runtime composition with provenance. Reflection can ask:

```js
PartialReflect.keys(MyType)
PartialReflect.findDescriptor(MyType, 'foo')
PartialReflect.baseTypes(MyType)
```

and recover not just the final member set, but the contributing partial types
and override order.

## Marketing Hook

This is mixins with a paper trail. You still get descriptor-copying power, but
the architecture remains inspectable after the copy.

## Lineage

The lineage is multiple inheritance linearization, plus the STL habit of
making capability composition visible to generic algorithms.

The JavaScript translation keeps normal prototype reflection, but points it at
a chain that includes the partial declarations JavaScript itself does not know
how to represent.
