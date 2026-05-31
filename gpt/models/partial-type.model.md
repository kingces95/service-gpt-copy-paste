# Partial Type Model

Partial Type family policy for adjacency, transparency, and descriptor
reprojection.

Contents

- [Family Policy](#family-policy): partial-type families pivoted by declared family policy.

## Family Policy

```txt
Family Policy
├─ set: PartialType family roots
├─ transform: family -> (family, policy, declaration)
├─ pivot: family
└─ display: family roots with policy declarations as children
```

```txt
PartialType
├─ Adjacent
└─ Transparent
   └─ false

Attachments
├─ Declarative
│  └─ Defines
├─ Procedural
│  └─ define
├─ Adjacent
└─ Transparent
   └─ true

AbstractAttachments
├─ Declarative
│  └─ DefinesAbstract
├─ Procedural
│  └─ defineAbstract
├─ Adjacent
└─ Transparent
   └─ true

Concept
├─ Declarative
│  └─ Implements
├─ Procedural
│  └─ implement
├─ Adjacent
│  ├─ Attachments
│  └─ Concept
└─ Transparent
   └─ false

PartialClass
├─ Declarative
│  └─ Composes
├─ Procedural
│  └─ compose
├─ Adjacent
│  ├─ Attachments
│  ├─ AbstractAttachments
│  ├─ PartialClass
│  └─ Concept
├─ Redeclare
│  └─ Concept
└─ Transparent
   └─ false

Shape
├─ Declarative
│  └─ Includes
├─ Adjacent
│  ├─ Concept
│  └─ Shape
└─ Transparent
   └─ true
```

`Adjacent` lists accepted partial-type families. Each adjacent family supplies
its declaration symbol through `Declarative`.
`Redeclare` lists adjacent families whose descriptors are reprojected onto the
current family during unified prototype construction. Types are projected to
families by `PartialType.getFamily()`.
