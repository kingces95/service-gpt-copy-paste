# Compiled Descriptors

Declarations should be allowed to change shape before they enter the chain.

Partial types do not merely copy descriptors. Each kind of partial type can
compile descriptors first. That is how a concept can turn an ordinary-looking
method declaration into an abstract requirement.

## Source

- `packages/partial-reflector/index.js`
- `packages/partial-concept/concept.js`
- `packages/partial-attachments/index.js`
- `packages/partial-concept/unit.test.js`

## The Pain

JavaScript has no abstract method syntax.

```js
class InputCursorConcept {
  get value() { }
  step() { }
}
```

Those declarations look like methods and accessors, but the intended meaning is
"required member", not "empty implementation."

## The Transform

`compiledPrototype` uses a partial type's `[Compile]` hook:

```js
const compile = type[Compile] || (o => o)
```

`Concept` compiles descriptors by abstractifying them:

```js
class Concept extends PartialType {
  static [Compile](descriptor) {
    descriptor = super[Compile](descriptor)
    descriptor = abstractify(descriptor)
    return descriptor
  }
}
```

The compiled link then participates in the meta-prototype chain.

```txt
Source concept declaration:

InputCursorConcept
└─ value getter, step method

Compiled descriptor link:

InputCursorConcept
└─ abstract value getter, abstract step method
```

The reflection query sees the compiled meaning:

```js
PartialReflect.findDescriptor(InputCursorConcept, 'step')
```

## What It Describes

This transform says: "the class body is syntax for a declaration, and the
partial type decides what that declaration means."

A concept method becomes an abstract requirement. An attachment method remains
a concrete member. Both can use similar JavaScript syntax while compiling to
different descriptor semantics.

## Marketing Hook

This is the loader doing the boring translation. Developers write the shape
they want to read; the transform makes the descriptor behave like the concept
it represents.

## Lineage

The lineage is C# interfaces and abstract members:

```csharp
interface ICursor {
  void Step();
}
```

The JavaScript translation uses class syntax as declaration syntax, then
compiles descriptors into abstract requirements at runtime.
