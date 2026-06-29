# Partial Symbols Model

Partial symbols are grouped by the role they play in the Partial system.

Contents

- [Symbol Roles](#symbol-roles): exported symbols pivoted by role.
- [Declaration Edge](#declaration-edge): declaration families mapped to symbols, verbs, and adjacent families.

## Symbol Roles

```txt
Symbol Roles
├─ set: exported symbols
├─ transform: symbol -> role
├─ pivot: role
└─ display: role roots with symbol leaves
```

```txt
Symbol Roles

Family Protocol
├─ Adjacent
├─ Compile
├─ Normalize
├─ Declarative
├─ Procedural
├─ Redeclare
├─ Transparent
└─ Precondition

Declaration Edge
├─ Defines
├─ DefinesAbstract
├─ Composes
├─ Implements
└─ Includes

Runtime Pipeline
├─ Thunk
│  └─ CreateThunk
├─ Argument Preparation
│  ├─ Defaults
│  └─ Transforms
├─ Receiver State
│  ├─ Fields
│  ├─ Initializer
│  └─ Self
├─ Checks
│  ├─ TypeChecks
│  ├─ ThisChecks
│  └─ ArgChecks
└─ Conditions
   ├─ Preconditions
   ├─ Postconditions
   ├─ TypePrecondition
   ├─ TypePostcondition
   └─ PartPrecondition
```

## Declaration Edge

```txt
Declaration Edge
├─ set: declaration family types
├─ transform: family type -> (family type, symbol, verb, adjacent families)
├─ pivot: family type
└─ display: family type rows with symbol, verb, and adjacent-family columns
```

```txt
Declaration Edge

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
