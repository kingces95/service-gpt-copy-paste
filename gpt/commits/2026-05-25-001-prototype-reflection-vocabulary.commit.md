# Prototype Reflection Vocabulary

This checkin sharpens the reflection vocabulary around prototype-chain lookup.

The invariant is:

```txt
getOwnX
└─ local/direct lookup on one prototype

findX
└─ first match found by walking the prototype hierarchy

findXs
└─ all matches found by walking the prototype hierarchy

Xs
└─ broad enumeration
```

That keeps `get` available for direct extraction, such as descriptor value
access, while reserving `find` for hierarchy search. `Descriptor.getValue`
remains a `get` because it reads from one descriptor; `Prototype.findValue`
becomes a `find` because it searches the chain before extracting the value.

This also keeps the higher-level Info API semantic: `Info.getMember` still
means "return the modeled member named key," while its reflection internals now
use `findDescriptor` to make the hierarchy search explicit.
