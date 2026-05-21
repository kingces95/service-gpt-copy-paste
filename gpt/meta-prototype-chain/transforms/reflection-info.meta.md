# Reflection Info Projection

Reflection becomes documentation when it has a stable object model.

`TypeInfo` and `MemberInfo` are not the chain transform themselves. They are
the documentation-facing projection over the transformed chains.

## Source

- `packages/info/index.js`
- `packages/info/concept.unit.test.js`
- `packages/info/partial-class.unit.test.js`
- `packages/info-to-pojo/unit.test.js`

## The Pain

Raw reflection APIs return descriptors, keys, symbols, constructors, and
prototype links. That is enough for code, but awkward for docs.

```js
Object.getOwnPropertyDescriptor(type.prototype, 'value')
Object.getOwnPropertySymbols(type.prototype)
```

Every documentation tool would need to rediscover the same interpretations.

## The Projection

`TypeInfo` queries `PartialReflect` and `PartialMetadata`:

```js
class InputCursorConcept extends Concept {
  get value() { }
  step() { }
}

class ListCursor {
  static {
    implement(this, InputCursorConcept, {
      get value() { return this.link.value },
      step() { this.link = this.link.next; return this },
    })
  }
}
```

```txt
Transformed reflection chain:

ListCursor
└─ InputCursorConcept (value, step)
   └─ Object

Info projection:

TypeInfo(ListCursor)
├─ concepts: InputCursorConcept
└─ members
   ├─ value, getter, conceptual
   └─ step, method, conceptual
```

```js
TypeInfo.from(type).members()
TypeInfo.from(type).concepts()
TypeInfo.from(type).associatedConcepts()
```

`MemberInfo` normalizes descriptor meaning:

```js
member.isMethod
member.isGetter
member.isConst
member.isConceptual
member.host
```

## What It Describes

This projection says: "the transformed chain is now a documentation graph."

It can explain:

- whether a type is a class, partial class, attachment, or concept
- which members are static or instance
- which members are abstract, conceptual, const, hidden, sealed, or visible
- which partial or concept owns a member
- which associated concepts are declared through metadata

## Marketing Hook

Runtime reflection becomes product surface. The same declarations that drive
behavior can generate help, docs, tests, and AI tool manifests.

## Lineage

The lineage is C# reflection and custom attribute data:

```csharp
typeof(Command).GetMembers()
typeof(Command).GetCustomAttributesData()
```

The JavaScript version reflects over richer transformed chains, then emits
plain info objects and POJOs.
