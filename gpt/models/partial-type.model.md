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
├─ Adjacent
└─ Transparent
   └─ true

AbstractAttachments
├─ Adjacent
└─ Transparent
   └─ true

Concept
├─ Adjacent
│  ├─ Defines -> Attachments
│  └─ Implements -> Concept
└─ Transparent
   └─ false

PartialClass
├─ Adjacent
│  ├─ Defines -> Attachments
│  ├─ Abstracts -> AbstractAttachments
│  ├─ Extends -> PartialClass
│  └─ Implements -> Concept
├─ Redeclare
│  └─ Concept
└─ Transparent
   └─ false

Shape
├─ Adjacent
│  ├─ Implements -> Concept
│  └─ Includes -> Shape
└─ Transparent
   └─ true
```

`Adjacent` maps declaration verbs to accepted partial-type families.
`Redeclare` lists adjacent families whose descriptors are reprojected onto the
current family during unified prototype construction. Types are projected to
families by `PartialType.getFamily()`.
