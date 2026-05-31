# Compose Partial Classes

Partial composition has its own vocabulary. JavaScript `extends` names lexical
class inheritance; Partial `compose` names attachment into the reflected partial
graph.

```txt
JavaScript Prototype
├─ extends
└─ inherited prototype chain

Partial Reflection
├─ Composes
├─ compose()
└─ composed partial graph
```

The declaration-family table is 1-1 across family type, symbol, and verb:

```txt
Family Type           Symbol           Verb            Adjacent Families
-----------           ------           ----            -----------------
Attachments           Defines          define          -
AbstractAttachments   DefinesAbstract  defineAbstract  -
PartialClass          Composes         compose         Attachments,
                                                       AbstractAttachments,
                                                       PartialClass,
                                                       Concept
Concept               Implements       implement       Attachments,
                                                       Concept
Shape                 Includes         -               Concept,
                                                       Shape
```

`DefinesAbstract` names abstract attachment declarations directly. `Composes`
names partial-class adjacency directly. The public package and verb use the
same word: `@kingjs/partial-compose` exports `compose`.
