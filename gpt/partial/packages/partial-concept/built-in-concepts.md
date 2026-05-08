# Built-In Concepts

## ScopeConcept

`ScopeConcept` is the base for concepts that need a notion of related scope.

In cursor terms, this is useful because equality and comparability often depend
on belonging to the same range/container.

## EquatableConcept

`EquatableConcept` is the local equivalent of a small equality interface.

Original root:

```csharp
public interface IEquatable<T> {
  bool Equals(T other);
}
```

Local translation:

```js
export class EquatableConcept extends ScopeConcept {
  static [Defines] = {
    equals(other) { return this == other }
  }

  equals(other) { }
}
```

The abstract member gives the concept its required shape. The default
definition gives simple types identity equality unless they override it.

## DisposeConcept

Disposal concepts map toward JS/C# resource cleanup protocols.

The source root is a mix of C# `IDisposable` and newer JS disposal symbols.
