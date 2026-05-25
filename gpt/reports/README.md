# Reports

Reports are generated views expressed as:

```txt
set
└─ transform to rows
   └─ pivot rows
      └─ display pivot
```

A report is useful when the transform is explicit enough that another assistant
can regenerate it and compare the output after the code changes.

## Chipping Report

A chipping report partitions a set by repeatedly removing one named subset from
the current remainder. Each chip is a binary pivot. During design, it is often
useful to view the process as nested subset/remainder splits. In the published
report, those splits flatten into one partition. The visual effect on the report
is that ordinary pivots add depth; chipping pivots add width.

```txt
set: elements
transform: element -> first matching chip
pivot: chip name
display: flat partition, omitting an empty final remainder
```

Interactive workflow:

```txt
1. Start with a set.
2. Pick a binary pivot that removes one useful subset.
3. Treat everything else as Remainder.
4. Repeat on Remainder.
5. Use the nested working view to verify each chip and remainder.
6. Publish the flattened partition.
7. Keep only the final Remainder, if any.
```

Step 1: pivot Models by Exact.

```txt
Models
├─ Exact
│  ├─ Hierarchy
│  ├─ Facets
│  ├─ Support
│  ├─ Members
│  ├─ Signature Shape
│  └─ Preconditions
└─ Remainder
   ├─ Name Basis
   ├─ Argument Order
   ├─ Overload Names
   ├─ Lexicon
   ├─ Roles
   └─ Argument Role
```

Step 2: pivot Remainder by Basis.

```txt
Models
├─ Exact
│  ├─ Hierarchy
│  ├─ Facets
│  ├─ Support
│  ├─ Members
│  ├─ Signature Shape
│  └─ Preconditions
└─ Remainder
   ├─ Basis
   │  ├─ Name Basis
   │  ├─ Argument Order
   │  └─ Overload Names
   └─ Remainder
      ├─ Lexicon
      ├─ Roles
      └─ Argument Role
```

Step 3: pivot Remainder by Interpretive.

```txt
Models
├─ Exact
│  ├─ Hierarchy
│  ├─ Facets
│  ├─ Support
│  ├─ Members
│  ├─ Signature Shape
│  └─ Preconditions
└─ Remainder
   ├─ Basis
   │  ├─ Name Basis
   │  ├─ Argument Order
   │  └─ Overload Names
   └─ Remainder
      ├─ Interpretive
      │  ├─ Lexicon
      │  ├─ Roles
      │  └─ Argument Role
      └─ Remainder
```

Published flattened view, omitting an empty final Remainder:

```txt
Models
├─ Exact
│  ├─ Hierarchy
│  ├─ Facets
│  ├─ Support
│  ├─ Members
│  ├─ Signature Shape
│  └─ Preconditions
├─ Basis
│  ├─ Name Basis
│  ├─ Argument Order
│  └─ Overload Names
└─ Interpretive
   ├─ Lexicon
   ├─ Roles
   └─ Argument Role
```

## Factor Report

A factor report expands each element into one row per factor, then pivots the
rows by factor. The report is exact when the factorization rule is mechanical
and applied across the whole set.

```txt
set: elements
transform: element -> (element, factor) rows
pivot: factor name
display: factor roots with element leaves
```

Interactive workflow:

```txt
1. Start with a set.
2. Choose a factorization rule.
3. Expand each element into `(element, factor)` rows.
4. Pivot rows by factor.
5. Display each factor as a root with matching elements as leaves.
6. Add a summary when the report exposes asymmetry or vocabulary pressure.
```

Example set:

```txt
RoleNames
├─ Editable
├─ FrontInsertable
├─ BackInsertable
├─ BulkAssignable
├─ BulkEditable
├─ GapAssignable
├─ Phased
└─ PhasedBulk
```

Factorization rule: split each role name into camel-case lexemes.

Generated rows:

```txt
Editable
└─ Editable -> Editable

FrontInsertable
├─ FrontInsertable -> Front
└─ FrontInsertable -> Insertable

BackInsertable
├─ BackInsertable -> Back
└─ BackInsertable -> Insertable

BulkAssignable
├─ BulkAssignable -> Bulk
└─ BulkAssignable -> Assignable

BulkEditable
├─ BulkEditable -> Bulk
└─ BulkEditable -> Editable

GapAssignable
├─ GapAssignable -> Gap
└─ GapAssignable -> Assignable

Phased
└─ Phased -> Phased

PhasedBulk
├─ PhasedBulk -> Bulk
└─ PhasedBulk -> Phased
```

Published pivot:

```txt
RoleName Lexemes

Assignable
├─ BulkAssignable
└─ GapAssignable

Back
└─ BackInsertable

Bulk
├─ BulkAssignable
├─ BulkEditable
└─ PhasedBulk

Editable
├─ Editable
└─ BulkEditable

Front
└─ FrontInsertable

Gap
└─ GapAssignable

Insertable
├─ FrontInsertable
└─ BackInsertable

Phased
├─ Phased
└─ PhasedBulk
```
