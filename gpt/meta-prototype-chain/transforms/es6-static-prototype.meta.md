# ES6 Static Prototype Transform

Static members deserve reflection without `Function.prototype` noise.

JavaScript exposes classes as functions, so naive static reflection sees
function machinery like `bind` and object machinery like `hasOwnProperty`.
The ES6 static transform builds a cleaner chain where static descriptors can be
queried with the same algorithms used for instance descriptors.

## Source

- `packages/es6-reflector/index.js`

## The Pain

Raw JavaScript gives different surfaces for instance and static reflection.

```js
class A {
  static a() { }
}

Object.getPrototypeOf(A) // Function.prototype-ish territory
```

The static side includes implementation artifacts of classes-as-functions.

## The Transform

`Es6Reflector` creates a parallel prototype chain for static descriptors:

```js
class A {
  static a() { }
}
```

```txt
Raw static chain:

A
└─ Function.prototype
   └─ Object.prototype

Transformed static descriptor chain:

A$ (static descriptors of A)
└─ Object* or Object`
   └─ null
```

That lets the reflector route both instance and static queries through the same
prototype-chain operations.

```js
Es6Reflect.getOwnDescriptor(A, 'a', { isStatic: true })
Es6Reflect.keys(A, { isStatic: true })
```

## What It Describes

This transform says: "class statics are a reflectable member surface, not
ordinary function instance clutter."

## Lineage

This is close to C# reflection's distinction between instance and static
members:

```csharp
typeof(A).GetMethods(BindingFlags.Static)
```

The JavaScript translation does not add a new runtime; it builds a cleaner
meta-chain so static reflection can be queried predictably.
