# Partial Metadata Chain

Static declarations on parts should be visible from the composed type.

The partial meta-prototype chain describes instance members. The metadata
transform maps that chain into a parallel chain of static field descriptors.

## Source

- `packages/partial-metadata/index.js`
- `packages/partial-reflect/unit.test.js`
- `packages/info/index.js`

## The Pain

Associated types and metadata often live on partial parts, not on the final
type.

```js
class InputRangePart extends PartialClass {
  static cursorType = InputCursorConcept
}

class MyRange {
  static { extend(this, InputRangePart) }
}
```

Naive static reflection on `MyRange` will not find `cursorType`, because the
static field was declared on `InputRangePart`.

## The Transform

`PartialMetadata` maps the partial instance hierarchy into static metadata
links:

```txt
Source declaration:

class InputRangePart extends PartialClass {
  static cursorType = InputCursorConcept
}

class MyRange {
  static { extend(this, InputRangePart) }
}

PartialReflect instance chain:

MyRange
└─ InputRangePart
   └─ Object

PartialMetadata chain:

MyRange (own static fields)
└─ InputRangePart (cursorType)
   └─ Object
```

The implementation walks `PartialReflect.hierarchy(type)` and copies static
field descriptors from each type into a new prototype link.

## What It Describes

This transform says: "metadata declared by a part is metadata of the composed
type for reflection purposes."

It enables:

```js
PartialMetadata.values(MyRange, { extensionOf: Concept })
TypeInfo.from(MyRange).associatedConcepts()
```

## Marketing Hook

This is where associated types become practical in JavaScript. A relationship
declared on a reusable part can still be discovered from the final type that
uses it.

## Lineage

The lineage is STL associated types and C# custom attribute data.

STL gives generic code a way to ask for related types:

```cpp
typename iterator_traits<I>::value_type
```

C# gives reflection a way to find metadata attached to declarations:

```csharp
member.GetCustomAttributesData()
```

The project combines those instincts: associated type metadata is declared in
JavaScript and surfaced through a transformed chain.
