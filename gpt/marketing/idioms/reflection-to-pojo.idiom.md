# Reflection To POJO

Runtime reflection is most useful when it can leave the runtime.

A reflection object is great for code, but docs, help screens, tests, and AI
tool manifests want plain data. The project treats POJO output as a serious
target.

## The JavaScript Idiom

Reflection often stays trapped in live objects.

```js
const names = Object.getOwnPropertyNames(type.prototype)
const symbols = Object.getOwnPropertySymbols(type.prototype)
```

That is useful locally, but every consumer has to learn the same descriptor
walk again.

## Declarative Translation

Normalize declarations into an info model, then emit POJOs.

```js
const info = TypeInfo.from(InputCursorConcept)
const pojo = await info.toPojo()
```

The output can describe concepts, members, symbols, accessors, base types, and
partial relationships as data.

```js
{
  kind: 'concept',
  name: 'InputCursorConcept',
  members: {
    value: { kind: 'getter' },
    step: { kind: 'method' },
  },
}
```

## Why This Matters

This is where runtime metadata earns its keep. Once reflection becomes plain
data, the same declarations can feed generated docs, CLI help, tests, workflow
inspection, and AI tool discovery.

TypeScript can check source. This layer can explain a running system.

## Lineage

C# reflection and custom attribute data are the ancestor. The useful move is
not just inspecting a type, but turning its declarations into stable data.

```csharp
typeof(Command).GetCustomAttributesData()
```

The JavaScript version keeps runtime visibility, then emits plain data that
docs, help, and tools can consume:

```js
const pojo = await TypeInfo.from(Command).toPojo()
```
