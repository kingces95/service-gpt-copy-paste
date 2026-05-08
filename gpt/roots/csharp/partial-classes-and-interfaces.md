# Partial Types and Interfaces

## Original Idea

C# supports partial classes and interfaces as named contracts.

Original style:

```csharp
public interface IEquatable<T> {
  bool Equals(T other);
}

public partial class Customer {
  public string Name { get; set; }
}
```

Interfaces declare expected members. Partial classes let a type be assembled
from multiple declarations.

## Local Translation

The local equivalent is `PartialClass`, `Concept`, and `Attachments`.

Example style:

```js
export class EditableContainerPart extends ContainerPart {
  static [Abstracts] = {
    insertAt(value, cursor) { },
    eraseAt(cursor) { },
  }

  static {
    extend(this, BackEditableContainerPart, {
      push(value) { this.insertAt(value, this.end()) },
    })
  }
}
```

Concept example:

```js
export class ForwardCursorConcept extends InputCursorConcept {
  clone() { }
}
```

Concrete types then `implement(...)` or `extend(...)` these partial types.

## Why It Matters

This gives JavaScript a runtime composition and certification layer. The project
can ask whether an object is composed of a concept, copy descriptor groups into
types, and reflect where members came from.
