# Shape Satisfaction

Shape satisfaction is the structural sibling of concept composition, but it is
queried structurally rather than published as nominal composition.

```txt
Shape declaration
└─ descriptor requirements
   └─ constructor prototype
      └─ structural `instanceof` result
```

## Source

```js
export class ForwardCursorShape extends Shape {
  step() { }
  clone() { }
}

class Cursor {
  step() { /* ... */ },
  clone() { /* ... */ },
}
```

## Before

```txt
Cursor
└─ Cursor.prototype

ForwardCursorShape
└─ descriptor requirements
```

## Transform

`Shape[Symbol.hasInstance]` checks the target constructor prototype against the
Shape descriptor surface. The shape does not become nominal composition on
ordinary types.

```txt
Cursor
└─ existing concrete descriptors

ForwardCursorShape
└─ remains a structural requirement
```

## Query

```js
cursor instanceof ForwardCursorShape
```

means:

```txt
Does cursor.constructor.prototype structurally satisfy ForwardCursorShape?
```

The result is cacheable because Shape checks constructor/prototype structure,
not live object state.

## Related

- [Partial Shape and Satisfy](../../notes/2026-05-20-004-partial-shape-and-satisfy.notes.md)
- [Partial Shape Design](../../notes/2026-05-20-003-partial-shape-design.notes.md)
- [Probe Observation](./probe-observation.meta.md)
