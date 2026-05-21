# Interface Contract

Interfaces that survive runtime.

Turn "objects passed here should have these methods" into a named runtime
contract that can be implemented, checked, and documented.

## The JavaScript Idiom

JavaScript often relies on informal contracts:

```js
function copy(target, range) {
  const first = range.begin()
  const last = range.end()

  while (!first.equals(last)) {
    target.value = first.value
    first.step()
    target.step()
  }
}
```

The function assumes `first` has `equals`, `value`, and `step`, but that
contract is not named or reflected.

## Declarative Translation

Use a `Concept` to name the contract.

```js
class CursorConcept extends Concept {
  get range() { }
  step() { }
}

class InputCursorConcept extends CursorConcept {
  get value() { }
}
```

Then a concrete cursor certifies the contract:

```js
class ListCursor extends ContainerCursor {
  static {
    implement(this, InputCursorConcept, {
      get value() { return this.link.value },
      step() { this.link = this.link.next; return this },
    })
  }
}
```

Now call sites can talk about the capability by name:

```js
const cursor = list.begin()

cursor instanceof InputCursorConcept // true
copy(target.begin(), list)
```

## Why This Matters

`cursor instanceof InputCursorConcept` becomes meaningful at runtime. The type
has opted into the contract, the required shape can be checked, and docs can
explain the capability by name.

This is the bridge between C# interfaces, C++ concepts, and JavaScript runtime
reflection.
