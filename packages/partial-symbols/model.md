# Partial Symbols Model

Partial symbols are grouped by the role they play in the Partial system.

Contents

- [Symbol Roles](#symbol-roles): exported symbols pivoted by role.

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
├─ From
├─ Redeclare
├─ Transparent
└─ Precondition

Declaration Edge
├─ Defines
├─ Abstracts
├─ Extends
├─ Implements
└─ Includes

Runtime Pipeline
├─ Thunk
│  └─ CreateThunk
├─ Argument Preparation
│  ├─ Defaults
│  └─ Transforms
├─ Checks
│  ├─ TypeChecks
│  ├─ ThisChecks
│  └─ ArgChecks
└─ Conditions
   ├─ Preconditions
   ├─ Postconditions
   ├─ TypePrecondition
   └─ TypePostcondition
```
