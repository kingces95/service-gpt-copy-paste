# Meta-Prototype Chain

The spine of the design is not reflection by itself. The spine is the ability
to transform prototype chains, then reflect over the transformed chain as if it
were ordinary JavaScript structure.

The move is:

1. start with a source chain, usually an ES6 prototype or static-prototype
   chain
2. transform it into a chain that says what the system wants to see
3. reuse normal reflection operations over that transformed chain
4. document what the transform means

This turns prototype chains into an explanatory medium. A chain can describe
runtime inheritance, partial composition, static metadata, condition wrapping,
concept membership, associated types, or documentation structure.

The doctrine is:

1. preserve the source distinctions that matter
2. remove the artifacts that do not
3. transform the chain so the right question becomes a normal reflection query

That makes the design less a clever reflection framework and more a disciplined
way to manufacture the right reflective surface.

## Marketing Frame

JavaScript has reflection, but raw reflection answers the wrong question too
often. It can tell you what ended up on a prototype. It cannot always tell you
why it got there, which declaration contributed it, which capability it
certifies, or which metadata should wrap it.

The project's answer is to build better chains. Once a transformed chain
exists, the same familiar operations become useful again:

```js
PartialReflect.keys(type)
PartialMetadata.findValue(type, cursorType)
TypeInfo.from(type).members()
```

The chain is the model. Reflection is the query language.

## Provenance

Meta-prototype chains are not a new idea. They are an extension of something
JavaScript already does to great effect.

The familiar prototype chain is the first example:

```js
class MyType { }
```

```txt
MyType.prototype
└─ Object.prototype
   └─ null
```

JavaScript already lets runtime behavior be described by a chain that includes
more than the user wrote. `Object.prototype` appears because the class is a
normal object-like class, even though the source did not explicitly say
`extends Object`.

## Static Chains

The static-prototype chain is the next familiar meta-chain. A class is also a
value, and that value has its own prototype chain:

```txt
Definition:           Prototype chain:      Static-prototype chain:
class MyType { }      MyType.prototype      MyType
                      └─ Object.prototype   └─ Function.prototype
                         └─ null               └─ Object.prototype
                                                  └─ null

class MyType          MyType.prototype      MyType
  extends Object { }  └─ Object.prototype   └─ Object
                         └─ null               └─ Function.prototype
                                                  └─ Object.prototype
                                                     └─ null

class MyType          MyType.prototype      MyType
  extends null        └─ null               └─ Function.prototype
                                               └─ Object.prototype
                                                  └─ null
```

This static chain is already a translation of source information into a
reflectable runtime structure. The source distinction between implicit
`Object`, explicit `extends Object`, and `extends null` matters. If not for
that source-level distinction, the static side could be normalized more
directly from the instance side.

That is why `this` inside a static method can call inherited static members:

```js
class Base {
  static describe() { return 'base' }
}

class Derived extends Base {
  static describeMore() {
    return this.describe()
  }
}
```

The `this` is evidence that static dispatch has a chain. C# does not allow
`this.myStatic()` because C# statics are not modeled as virtual members on a
class-object hierarchy. JavaScript class values do have a prototype chain, so
static members participate in a kind of meta-prototype lookup.

## Static Reflection Transform

`Es6Reflector` takes the existing static chain and translates it again so class
statics can be queried like instance members without including
`Function.prototype` and `Object.prototype` noise.

```txt
1. class A { }

ES6 chains:                         Es6Reflector chain:
A                                   A$
└─ Function.prototype          ->    └─ Object*
   └─ Object.prototype                  └─ null
      └─ null

A.prototype
└─ Object.prototype
   └─ null

2. class A extends Object { }

ES6 chains:                         Es6Reflector chain:
A                                   A$
└─ Object                      ->    └─ Object`
   └─ Function.prototype                └─ null
      └─ Object.prototype
         └─ null

A.prototype
└─ Object.prototype
   └─ null

3. class A extends null

ES6 chains:                         Es6Reflector chain:
A                                   A$
└─ Function.prototype          ->    └─ null
   └─ Object.prototype
      └─ null

A.prototype
└─ null
```

That is the first explicit transform in this design: take a real JavaScript
chain, preserve the source distinctions that matter, remove the artifacts that
do not, and expose the result to ordinary reflection operations.

## Partial Derivation

`PartialReflect` is the next derivation. It applies the same idea to partial
composition.

Where JavaScript implicitly includes `Object.prototype` when it makes sense,
`PartialReflect` implicitly includes partial types when the type is composed of
them.

```js
class MyType {
  static { extend(this, SitRep) }
  foo() { }
}
```

```txt
Runtime prototype chain:

MyType
└─ Object

Partial meta-prototype chain:

MyType (foo)
└─ SitRep
   └─ Fubar
      └─ Snafu
         └─ Object
```

The transformed chain can then answer questions raw JavaScript cannot:

```js
PartialReflect.findDescriptor(MyType, 'foo')
PartialReflect.baseTypes(MyType)
```

## Metadata Derivation

`PartialMetadata` derives another chain from the partial chain. It maps the
partial instance hierarchy into static field metadata.

```js
class InputRangePart extends PartialClass {
  static cursorType = InputCursorConcept
}

class MyRange {
  static { extend(this, InputRangePart) }
}
```

```txt
PartialReflect instance chain:

MyRange
└─ InputRangePart
   └─ Object

PartialMetadata chain:

MyRange
└─ InputRangePart (cursorType)
   └─ Object
```

This is what lets an associated type declared on a part be discovered while
reflecting the final composed type.

## Condition Derivation

Condition chains are a further derivation. They take symbol-attached metadata
objects and expand them into member-keyed chains that thunks can execute.

```js
static [Preconditions] = {
  step() { throwIfEnd(this) },
  get value() { throwIfEnd(this) },
}
```

```txt
Source metadata chain:

MyCursor ([Preconditions])
└─ InputCursorConcept ([Preconditions])
   └─ CursorConcept ([Preconditions])

Transformed condition chain:

MyCursor (step)
└─ InputCursorConcept (value, step)
   └─ CursorConcept (value)
```

Each derivation keeps the same basic bargain: transform the chain so the right
question becomes a normal reflection query.

## Reading Order

- `toc.meta.md`: index of notes in this directory.
- `catalog.meta.md`: quick catalog of known transforms and what each one describes.
- `transforms/`: one note per transform.

## Documentation Policy

Each transform note should answer:

- What source chain is being transformed?
- What target chain is produced?
- What question does the target chain make easy to answer?
- Which source files and tests demonstrate it?
- Is there a strong lineage from another technology?

Prefer concrete examples. The strongest notes show a small source declaration,
the transformed chain, and the reflection query enabled by the transform.

## Example Format

When possible, show the transform as source plus before/after trees. The goal
is for a developer to see exactly how the source declaration becomes a
reflectable structure.

```js
static [Preconditions] = {
  step() { throwIfEnd(this) },
  get value() { throwIfEnd(this) },
}
```

```txt
Source metadata chain:

MyCursor ([Preconditions])
└─ InputCursorConcept ([Preconditions])
   └─ CursorConcept ([Preconditions])

Transformed condition chain:

MyCursor (step)
└─ InputCursorConcept (value, step)
   └─ CursorConcept (value)
```

Then show the query or behavior unlocked by that transform:

```js
getConditions(MyCursor, 'step')
```

Use this pattern flexibly:

- source: the declaration the developer writes
- before: the source chain or raw JS surface
- after: the transformed chain, projection, or runtime probe
- query: the reflection operation, generated docs, validation, or behavior
  enabled by the transform
