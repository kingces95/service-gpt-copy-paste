# Container Part Tree

Container Part capability pivots for target inheritance, role grouping,
container support, precondition coverage, and missing support.

Contents

[Lexicon](#lexicon): short definitions for recurring role names.

**Part Structure**

- [Hierarchy](#hierarchy): Parts pivoted by primary inheritance.
- [Facets](#facets): Parts pivoted by secondary composition.
- [Roles](#roles): Parts pivoted by behavioral family.
- [Part Lexeme](#part-lexeme): Part names pivoted by shared lexeme.
- [Support](#support): Parts pivoted by container support.

**Part Members**

- [Members](#members): members pivoted by Part with container columns.
- [Overrides](#overrides): inherited members pivoted by implementation host.
- [Preconditions](#preconditions): members pivoted by reusable assertion member.
- [Non-Public Members](#non-public-members): `$` members chip-pivoted by assert/abstract role, then pivoted by Part.

**Name Model**

- [Name Basis](#name-basis): members pivoted by STL name basis.
- [Overload Names](#overload-names): members pivoted by JS overload-name pressure.

**Call Shape**

- [Signature Shape](#signature-shape): members pivoted by exact parameter shape.
- [Default Arguments](#default-arguments): members with defaults pivoted by declaration Part.
- [Argument Order](#argument-order): members pivoted by STL argument order basis.
- [Argument Role](#argument-role): members pivoted by fuzzy argument role.

**Indexes**

- [Member Index](#member-index): members pivoted by member with container columns.
- [Lexeme Index](#lexeme-index): member lexemes pivoted by lexeme with container columns.

## Lexicon

Short definitions for recurring role names.

```txt
Editable
└─ cursor denotes the element position: insertValue / erase

Phased
└─ cursor denotes the predecessor or boundary: beforeBegin / insertValueAfter / eraseAfter

FrontInsertable
└─ front endpoint helpers: pushFront / popFront

BackInsertable
└─ back endpoint helpers: pushBack / popBack

BulkAssignable
└─ whole-container replacement and resizing: assignRange / resize / clear

BulkEditable
└─ range insertion and erasure at element-position cursors

GapAssignable
└─ gap-backed whole-container replacement and resizing

PhasedBulk
└─ range insertion and erasure using predecessor or boundary cursors
```

## Part Structure

### Hierarchy

```txt
Hierarchy
├─ set: Part names
├─ transform: name -> (name, parent, parent kind)
├─ pivot: parent
├─ display: inheritance tree
└─ filter: parent kind = primary
```

```txt
ContainerPart
├─ SizedContainerPart
│  └─ IndexableContainerPart
│     └─ ByteContainerPart
├─ CapacityContainerPart
│  └─ ReservableContainerPart
├─ ClearableContainerPart
│  └─ BulkAssignableContainerPart
│     └─ GapAssignableContainerPart
├─ EditableContainerPart
│  └─ BulkEditableContainerPart
│     └─ GapEditableContainerPart
├─ FrontInsertableContainerPart
├─ BackInsertableContainerPart
├─ PhasedContainerPart
│  └─ PhasedBulkContainerPart
└─ AssociativeContainerPart
   ├─ SetAssociativeContainerPart
   └─ MapAssociativeContainerPart
```

### Facets

```txt
Facets
├─ set: Part names
├─ transform: name -> (name, parent, parent kind)
├─ pivot: parent
├─ display: inheritance tree
└─ filter: parent kind = secondary
```

```txt
EditableContainerPart
├─ FrontInsertableContainerPart
└─ BackInsertableContainerPart

GapAssignableContainerPart
└─ GapEditableContainerPart
```

### Roles

```txt
Roles
├─ set: Part names
├─ transform: name -> (name, ~role)
├─ pivot: ~role
└─ display: Part tree under role roots
```

```txt
Roles
├─ Size: size and indexed access
├─ Capacity: reserved storage queries and requests
├─ Assignment: whole-container replacement and resizing
├─ Mutation: cursor-positioned editing
└─ Association: key-based lookup and mutation
```

```txt
Size
└─ SizedContainerPart
   └─ IndexableContainerPart
      └─ ByteContainerPart

Capacity
└─ CapacityContainerPart
   └─ ReservableContainerPart

Assignment
└─ ClearableContainerPart
   └─ BulkAssignableContainerPart
      └─ GapAssignableContainerPart

Mutation
├─ EditableContainerPart
│  └─ BulkEditableContainerPart
│     └─ GapEditableContainerPart
├─ FrontInsertableContainerPart
├─ BackInsertableContainerPart
└─ PhasedContainerPart
   └─ PhasedBulkContainerPart

Association
└─ AssociativeContainerPart
   ├─ SetAssociativeContainerPart
   └─ MapAssociativeContainerPart
```

### Part Lexeme

```txt
Part Lexeme
├─ set: Part names
├─ transform: name -> (name, lexeme*)
├─ pivot: lexeme
├─ display: lexeme roots with matching names as children
└─ filter: lexemes with at least two matching names
```

```txt
Assignable
├─ BulkAssignableContainerPart
└─ GapAssignableContainerPart

Associative
├─ AssociativeContainerPart
├─ SetAssociativeContainerPart
└─ MapAssociativeContainerPart

Bulk
├─ BulkAssignableContainerPart
├─ BulkEditableContainerPart
└─ PhasedBulkContainerPart

Editable
├─ EditableContainerPart
├─ BulkEditableContainerPart
└─ GapEditableContainerPart

Gap
├─ GapAssignableContainerPart
└─ GapEditableContainerPart

Insertable
├─ FrontInsertableContainerPart
└─ BackInsertableContainerPart

Phased
├─ PhasedContainerPart
└─ PhasedBulkContainerPart
```

### Support

```txt
Support
├─ set: Part names
├─ transform: name -> (name, ~role, container*)
├─ pivot: ~role, name
└─ display: name rows by container columns
```

```txt
                       ForwardList
                       │   List
                       │   │   Deque
                       │   │   │   ArrayMap
                       │   │   │   │   Vector
                       │   │   │   │   │   UnorderedSet
                       │   │   │   │   │   │   UnorderedMap
Parts \ Containers     │   │   │   │   │   │   │

Size
 ├─ Sized              -   x   x   x   x   x   x
 ├─ Indexable          -   -   x   x   x   -   -
 └─ Byte               -   -   -   -   x   -   -

Assignment
 ├─ Clearable          x   x   x   x   x   x   x
 ├─ BulkAssignable     x   x   x   x   x   -   -
 └─ GapAssignable      -   -   -   x   x   -   -

Mutation
 ├─ Editable           -   x   x   x   x   -   -
 ├─ FrontInsertable    x   x   x   x   x   -   -
 ├─ BackInsertable     -   x   x   x   x   -   -
 ├─ BulkEditable       -   -   x   x   x   -   -
 ├─ GapEditable        -   -   -   x   x   -   -
 ├─ Phased             x   x   -   -   -   -   -
 └─ PhasedBulk         x   x   -   -   -   -   -

Association
 ├─ Associative        -   -   -   -   -   x   x
 ├─ SetAssociative     -   -   -   -   -   x   -
 └─ MapAssociative     -   -   -   -   -   -   x

Capacity
 ├─ Capacity           -   -   -   -   x   -   -
 └─ Reservable         -   -   -   -   x   -   -
```

## Part Members

### Members

```txt
Members
├─ set: public Part members
├─ transform: member -> (member, ~role, decl Part, container*)
├─ pivot: ~role, decl Part
└─ display: member rows by container columns
```

```txt
Members

                                  ForwardList
                                  |   List
                                  |   |   Deque
                                  |   |   |   ArrayMap
                                  |   |   |   |   Vector
                                  |   |   |   |   |   UnorderedSet
                                  |   |   |   |   |   |   UnorderedMap
Members \ Containers              |   |   |   |   |   |   |

Universal
└─ ContainerPart
   └─ isEmpty                     x   x   x   x   x   x   x

Size
├─ SizedContainerPart
│  └─ size                        -   x   x   x   x   x   x
├─ IndexableContainerPart
│  ├─ at                          -   -   x   x   x   -   -
│  └─ setAt                       -   -   x   x   x   -   -
└─ ByteContainerPart
   └─ span                        -   -   -   -   x   -   -

Capacity
├─ CapacityContainerPart
│  └─ capacity                    -   -   -   -   x   -   -
└─ ReservableContainerPart
   └─ reserve                     -   -   -   -   x   -   -

Assignment
├─ ClearableContainerPart
│  └─ clear                       x   x   x   x   x   x   x
└─ BulkAssignableContainerPart
   ├─ resize                      x   x   x   x   x   -   -
   ├─ assignRange                 x   x   x   x   x   -   -
   └─ assign                      x   x   x   x   x   -   -

Mutation
├─ EditableContainerPart
│  ├─ insertValue                 -   x   x   x   x   -   -
│  └─ erase                       -   x   x   x   x   -   -
├─ BulkEditableContainerPart
│  ├─ insertRange                 -   -   x   x   x   -   -
│  ├─ insert                      -   -   x   x   x   -   -
│  └─ replaceRange                -   -   x   x   x   -   -
├─ FrontInsertableContainerPart
│  ├─ pushFront                   x   x   x   x   x   -   -
│  └─ popFront                    x   x   x   x   x   -   -
├─ BackInsertableContainerPart
│  ├─ pushBack                    -   x   x   x   x   -   -
│  └─ popBack                     -   x   x   x   x   -   -
├─ PhasedContainerPart
│  ├─ beforeBegin                 x   x   -   -   -   -   -
│  ├─ insertValueAfter            x   x   -   -   -   -   -
│  └─ eraseAfter                  x   x   -   -   -   -   -
└─ PhasedBulkContainerPart
   ├─ insertRangeAfter            x   x   -   -   -   -   -
   ├─ insertAfter                 x   x   -   -   -   -   -
   └─ replaceRangeAfter           x   x   -   -   -   -   -

Association
├─ AssociativeContainerPart
│  ├─ contains                    -   -   -   -   -   x   x
│  └─ erase                       -   -   -   -   -   x   x
├─ SetAssociativeContainerPart
│  └─ insert                      -   -   -   -   -   x   -
└─ MapAssociativeContainerPart
   ├─ at                          -   -   -   -   -   -   x
   └─ insertOrAssign              -   -   -   -   -   -   x
```

### Overrides

```txt
Overrides
├─ set: inherited public Part members
├─ transform: member -> (member, ~role, impl Part, decl Part)
├─ pivot: ~role, impl Part, decl Part
└─ display: member leaves under decl Part
```

```txt
Overrides

Mutation
├─ EditableContainerPart
│  ├─ FrontInsertableContainerPart
│  │  ├─ pushFront(value)
│  │  └─ popFront()
│  └─ BackInsertableContainerPart
│     ├─ pushBack(value)
│     └─ popBack()
├─ BulkEditableContainerPart
│  └─ EditableContainerPart
│     └─ insertValue(cursor = this.begin(), value)
├─ GapEditableContainerPart
│  └─ BulkEditableContainerPart
│     ├─ insertRange(cursor, range)
│     └─ EditableContainerPart
│        └─ erase(first, last = next(first))
└─ GapAssignableContainerPart
   └─ BulkAssignableContainerPart
      ├─ resize(count, value = this.defaultValue$)
      └─ assignRange(range)
```

### Preconditions

```txt
Preconditions
├─ set: checked public Part members
├─ transform: member -> (member, Part, assert*)
├─ pivot: Part, member
└─ display: assert leaves under member
```

```txt
Preconditions

ContainerPart
└─ assert$
   ├─ notNull(value)
   ├─ nonEmpty()
   ├─ ownCursor(cursor)
   │  └─ notNull(cursor)
   ├─ notEnd(cursor)
   ├─ firstThenLast(first, last)
   └─ ownCursorPair(first, last)
      ├─ ownCursor(first)
      ├─ ownCursor(last)
      └─ firstThenLast(first, last)

FrontInsertableContainerPart
└─ popFront()
   └─ nonEmpty()

BackInsertableContainerPart
└─ popBack()
   └─ nonEmpty()

EditableContainerPart
├─ insertValue(cursor, value)
│  └─ ownCursor(cursor)
└─ erase(first, last = next(first))
   └─ ownCursorPair(first, last)

PhasedContainerPart
├─ assert$
│  └─ ownButNotEndCursor(cursor)
│     ├─ ownCursor(cursor)
│     └─ notEnd(cursor)
├─ insertValueAfter(cursor, value)
│  └─ ownButNotEndCursor(cursor)
└─ eraseAfter(first, last = next(first, 2))
   ├─ ownButNotEndCursor(first)
   └─ ownCursorPair(next(first), last)

IndexableContainerPart
├─ assert$
│  └─ lessThanSize(index)
├─ at(index)
│  └─ lessThanSize(index)
└─ setAt(index, value)
   └─ lessThanSize(index)

BulkEditableContainerPart
├─ insertRange(cursor, range)
│  └─ ownCursor(cursor)
├─ insert(cursor, count, value)
│  └─ ownCursor(cursor)
└─ replaceRange(first, last, replacementRange)
   └─ ownCursorPair(first, last)

PhasedBulkContainerPart
├─ insertRangeAfter(cursor, range)
│  └─ ownButNotEndCursor(cursor)
├─ insertAfter(cursor, count, value)
│  └─ ownButNotEndCursor(cursor)
└─ replaceRangeAfter(first, last, replacementRange)
   ├─ ownButNotEndCursor(first)
      └─ ownCursorPair(next(first), last)
```

### Non-Public Members

```txt
Non-Public Members
├─ set: Part members whose names end in $
├─ transform: member -> (member, chip, Part)
├─ chip pivot: Assert, Abstract
├─ pivot: Part
└─ display: member leaves under Part roots
```

```txt
Non-Public Members

Assert
├─ ContainerPart
│  ├─ notNullAssert$(value)
│  ├─ nonEmptyAssert$()
│  ├─ ownCursorAssert$(cursor)
│  ├─ notEndAssert$(cursor)
│  ├─ firstThenLastAssert$(first, last)
│  └─ ownCursorPairAssert$(first, last)
├─ PhasedContainerPart
│  └─ ownButNotEndCursorAssert$(cursor)
└─ IndexableContainerPart
   └─ lessThanSizeAssert$(index, throwOutOfBounds)

Abstract
├─ ReservableContainerPart
│  └─ setCapacity$(count)
└─ GapEditableContainerPart
   ├─ openGap$(cursor, count)
   └─ closeGap$(first, last)

Remainder
├─ ContainerPart
│  └─ sourceRange$(range)
└─ BulkAssignableContainerPart
   └─ defaultValue$
```

## Name Model

### Name Basis

```txt
Exact Match
├─ set: public container members
├─ transform: member -> (member, STL analog, STL family)
├─ pivot: STL family
├─ display: member with STL analog
└─ filter: member name matches STL analog lexeme
```

```txt
Exact Match
├─ Shared
│  ├─ clear()                              ~ clear()
│  └─ size                                 ~ size()
├─ Sequence
│  ├─ assign(count, value)                 ~ assign(count, value)
│  ├─ assignRange(range)                   ~ assign_range(rg)
│  ├─ at(index)                            ~ at(index)
│  ├─ capacity                             ~ capacity()
│  ├─ erase(first, last)                   ~ erase(first, last)
│  ├─ insert(cursor, count, value)         ~ insert(pos, count, value)
│  ├─ insertRange(cursor, range)           ~ insert_range(pos, rg)
│  ├─ popBack()                            ~ pop_back()
│  ├─ popFront()                           ~ pop_front()
│  ├─ pushBack(value)                      ~ push_back(value)
│  ├─ pushFront(value)                     ~ push_front(value)
│  ├─ reserve(count)                       ~ reserve(count)
│  ├─ resize(count, value)                 ~ resize(count, value)
│  └─ Phased
│     ├─ beforeBegin()                     ~ before_begin()
│     ├─ eraseAfter(first, last)           ~ erase_after(first, last)
│     ├─ insertAfter(cursor, count, value) ~ insert_after(pos, count, value)
│     └─ insertRangeAfter(cursor, range)   ~ insert_range_after(pos, rg)
└─ Associative
   ├─ at(key)                              ~ at(key)
   ├─ contains(key)                        ~ contains(key)
   ├─ erase(key)                           ~ erase(key)
   ├─ insert(key)                          ~ insert(key)
   └─ insertOrAssign(key, value)           ~ insert_or_assign(key, value)
```

```txt
Justifications
├─ set: public container members not in Exact Match
├─ transform: member -> (member, justification, analog?)
├─ pivot: justification
├─ display: member with analog when present
└─ filter: member name does not match STL analog lexeme
```

```txt
Justifications
├─ STL Justified
│  └─ isEmpty                              ~ empty()
├─ JS Overload Name
│  ├─ insertValue(cursor, value)           ~ insert(pos, value)
│  └─ insertValueAfter(cursor, value)      ~ insert_after(pos, value)
├─ Optimization
│  └─ setAt(index, value)
├─ Overlapping Range
│  ├─ replaceRange(first, last, replacementRange)
│  └─ replaceRangeAfter(first, last, replacementRange)
└─ Remainder
   └─ span(range)
```

### Overload Names

Members whose STL-equivalent operation would be an overload, but whose JS
surface needs a distinct name because the shorter operation name is reserved for
the fuller primitive signature.

```txt
Overload Names

insert(cursor, count, value)
└─ insertValue(cursor, value)

insertAfter(cursor, count, value)
└─ insertValueAfter(cursor, value)
```

## Call Shape

### Signature Shape

```txt
Signature Shape
├─ set: public container members
├─ transform: member -> (member, signature)
├─ pivot: signature
└─ display: member leaves under signature
```

```txt
Signature

Property
├─ isEmpty
├─ size
└─ capacity

Nullary
├─ clear()
├─ beforeBegin()
├─ popFront()
└─ popBack()

Index
├─ at(index)
└─ setAt(index, value)

Key
├─ contains(key)
├─ erase(key)
├─ at(key)
├─ insert(key)
└─ insertOrAssign(key, value)

Value
├─ pushBack(value)
└─ pushFront(value)

CursorValue
├─ insertValue(cursor, value)
└─ insertValueAfter(cursor, value)

Range
├─ assignRange(range)
└─ span(range)

CursorRange
├─ insertRange(cursor, range)
└─ insertRangeAfter(cursor, range)

CursorPair
├─ erase(first, last = next(first))
└─ eraseAfter(first, last = next(first, 2))

CursorPairRange
├─ replaceRange(first, last, replacementRange)
└─ replaceRangeAfter(first, last, replacementRange)

Count
└─ reserve(count)

CountValue
├─ resize(count, value)
└─ assign(count, value)

CursorCountValue
├─ insert(cursor, count, value)
└─ insertAfter(cursor, count, value)
```

### Default Arguments

```txt
Default Arguments
├─ set: public container members with defaulted parameters
├─ transform: member -> (declaration Part, member)
├─ pivot: declaration Part
└─ display: member signatures under Part roots
```

```txt
Default Arguments

EditableContainerPart
└─ erase(first, last = next(first))

PhasedContainerPart
└─ eraseAfter(first, last = next(first, 2))

BulkAssignableContainerPart
└─ resize(count, value = this.defaultValue$)

BulkEditableContainerPart
└─ insertValue(cursor = this.begin(), value)
```

### Argument Order

Public container members pivoted by whether argument order follows the STL
position-first basis.

```txt
Argument Order

Matches STL
├─ insertValue(cursor, value)             ~ insert(pos, value)
├─ insert(cursor, count, value)           ~ insert(pos, count, value)
├─ insertRange(cursor, range)             ~ insert_range(pos, rg)
├─ erase(first, last)                     ~ erase(first, last)
├─ resize(count, value)                   ~ resize(count, value)
├─ reserve(count)                         ~ reserve(count)
├─ assign(count, value)                   ~ assign(count, value)
├─ Associative
│  ├─ at(key)                             ~ at(key)
│  ├─ contains(key)                       ~ contains(key)
│  ├─ erase(key)                          ~ erase(key)
│  ├─ insert(key)                         ~ insert(key)
│  └─ insertOrAssign(key, value)          ~ insert_or_assign(key, value)
└─ Phased
   ├─ insertValueAfter(cursor, value)    ~ insert_after(pos, value)
   ├─ insertAfter(cursor, count, value)  ~ insert_after(pos, count, value)
   ├─ insertRangeAfter(cursor, range)    ~ insert_range_after(pos, rg)
   └─ eraseAfter(first, last)            ~ erase_after(first, last)

No STL Order Basis
├─ setAt(index, value)
├─ replaceRange(first, last, replacementRange)
├─ replaceRangeAfter(first, last, replacementRange)
└─ span(range)
```

### Argument Role

```txt
Argument Role
├─ set: public container members
├─ transform: member -> (member, ~argument role)
├─ pivot: ~argument role
└─ display: member leaves under role roots
```

```txt
Argument Role

Size
└─ cardinality and emptiness queries
   ├─ isEmpty
   └─ size

Capacity
└─ reserved storage queries and requests
   ├─ capacity
   └─ reserve(count)

Endpoint
└─ whole-container or front/back endpoint operations
   ├─ clear()
   ├─ popFront()
   ├─ pushFront(value)
   ├─ popBack()
   └─ pushBack(value)

Index
└─ numeric-position random access
   ├─ at(index)
   └─ setAt(index, value)

Key
└─ associative lookup and mutation by key
   ├─ contains(key)
   ├─ erase(key)
   ├─ at(key)
   ├─ insert(key)
   └─ insertOrAssign(key, value)

Value
└─ count-sized fill or resize operations carrying a value payload
   ├─ resize(count, value)
   └─ assign(count, value)

Count
└─ cursor-position operations bounded by an explicit count
   ├─ insert(cursor, count, value)
   └─ Phased
      └─ insertAfter(cursor, count, value)

Cursor
└─ single-position operations at an explicit cursor
   ├─ insertValue(cursor, value)
   └─ Phased
      └─ insertValueAfter(cursor, value)

Range
└─ operations that consume a range object as input
   ├─ assignRange(range)
   ├─ insertRange(cursor, range)
   └─ Phased
      └─ insertRangeAfter(cursor, range)

CursorPair
└─ operations bounded by explicit/default first/last cursors
   ├─ erase(first, last = next(first))
   └─ Phased
      └─ eraseAfter(first, last = next(first, 2))

CursorPairRange
└─ replacement operations bounded by first/last cursors and a source range
   ├─ replaceRange(first, last, replacementRange)
   └─ Phased
      └─ replaceRangeAfter(first, last, replacementRange)

Remainder
└─ members whose call form exposes vocabulary pressure
   ├─ beforeBegin()
   └─ span(range)
```

## Indexes

### Member Index

```txt
Member Index
├─ set: public container members
├─ transform: member -> (member, container*)
├─ pivot: member
└─ display: member rows by container columns
```

```txt
Member Index

                                  ForwardList
                                  |   List
                                  |   |   Deque
                                  |   |   |   ArrayMap
                                  |   |   |   |   Vector
                                  |   |   |   |   |   UnorderedSet
                                  |   |   |   |   |   |   UnorderedMap
Members \ Containers              |   |   |   |   |   |   |

assign                            x   x   x   x   x   -   -
assignRange                       x   x   x   x   x   -   -
at                                -   -   x   x   x   -   x
beforeBegin                       x   x   -   -   -   -   -
capacity                          -   -   -   -   x   -   -
clear                             x   x   x   x   x   x   x
contains                          -   -   -   -   -   x   x
erase                             -   x   x   x   x   x   x
eraseAfter                        x   x   -   -   -   -   -
insert                            -   -   x   x   x   x   -
insertAfter                       x   x   -   -   -   -   -
insertOrAssign                    -   -   -   -   -   -   x
insertRange                       -   -   x   x   x   -   -
insertRangeAfter                  x   x   -   -   -   -   -
insertValue                       -   x   x   x   x   -   -
insertValueAfter                  x   x   -   -   -   -   -
isEmpty                           x   x   x   x   x   x   x
popBack                           -   x   x   x   x   -   -
popFront                          x   x   x   x   x   -   -
pushBack                          -   x   x   x   x   -   -
pushFront                         x   x   x   x   x   -   -
replaceRange                      -   -   x   x   x   -   -
replaceRangeAfter                 x   x   -   -   -   -   -
reserve                           -   -   -   -   x   -   -
resize                            x   x   x   x   x   -   -
setAt                             -   -   x   x   x   -   -
size                              -   x   x   x   x   x   x
span                              -   -   -   -   x   -   -
```

### Lexeme Index

```txt
Lexeme Index
├─ set: public container member names
├─ transform: name -> (name, lexeme*, container*)
├─ pivot: lexeme
└─ display: name rows by container columns
```

```txt
Lexeme Index

                                  ForwardList
                                  |   List
                                  |   |   Deque
                                  |   |   |   ArrayMap
                                  |   |   |   |   Vector
                                  |   |   |   |   |   UnorderedSet
                                  |   |   |   |   |   |   UnorderedMap
Lexemes \ Containers              |   |   |   |   |   |   |

After
├─ eraseAfter                     x   x   -   -   -   -   -
├─ insertAfter                    x   x   -   -   -   -   -
├─ insertRangeAfter               x   x   -   -   -   -   -
├─ insertValueAfter               x   x   -   -   -   -   -
└─ replaceRangeAfter              x   x   -   -   -   -   -

Assign
├─ assign                         x   x   x   x   x   -   -
├─ assignRange                    x   x   x   x   x   -   -
└─ insertOrAssign                 -   -   -   -   -   -   x

At
├─ at                             -   -   x   x   x   -   x
└─ setAt                          -   -   x   x   x   -   -

Back
├─ popBack                        -   x   x   x   x   -   -
└─ pushBack                       -   x   x   x   x   -   -

Before
└─ beforeBegin                    x   x   -   -   -   -   -

Begin
└─ beforeBegin                    x   x   -   -   -   -   -

Capacity
└─ capacity                       -   -   -   -   x   -   -

Clear
└─ clear                          x   x   x   x   x   x   x

Contains
└─ contains                       -   -   -   -   -   x   x

Empty
└─ isEmpty                        x   x   x   x   x   x   x

Erase
├─ erase                          -   x   x   x   x   x   x
└─ eraseAfter                     x   x   -   -   -   -   -

Front
├─ popFront                       x   x   x   x   x   -   -
└─ pushFront                      x   x   x   x   x   -   -

Insert
├─ insert                         -   -   x   x   x   x   -
├─ insertAfter                    x   x   -   -   -   -   -
├─ insertOrAssign                 -   -   -   -   -   -   x
├─ insertRange                    -   -   x   x   x   -   -
├─ insertRangeAfter               x   x   -   -   -   -   -
├─ insertValue                    -   x   x   x   x   -   -
└─ insertValueAfter               x   x   -   -   -   -   -

Is
└─ isEmpty                        x   x   x   x   x   x   x

Or
└─ insertOrAssign                 -   -   -   -   -   -   x

Pop
├─ popBack                        -   x   x   x   x   -   -
└─ popFront                       x   x   x   x   x   -   -

Push
├─ pushBack                       -   x   x   x   x   -   -
└─ pushFront                      x   x   x   x   x   -   -

Range
├─ assignRange                    x   x   x   x   x   -   -
├─ insertRange                    -   -   x   x   x   -   -
├─ insertRangeAfter               x   x   -   -   -   -   -
├─ replaceRange                   -   -   x   x   x   -   -
└─ replaceRangeAfter              x   x   -   -   -   -   -

Replace
├─ replaceRange                   -   -   x   x   x   -   -
└─ replaceRangeAfter              x   x   -   -   -   -   -

Reserve
└─ reserve                        -   -   -   -   x   -   -

Resize
└─ resize                         x   x   x   x   x   -   -

Set
└─ setAt                          -   -   x   x   x   -   -

Size
└─ size                           -   x   x   x   x   x   x

Span
└─ span                           -   -   -   -   x   -   -

Value
├─ insertValue                    -   x   x   x   x   -   -
└─ insertValueAfter               x   x   -   -   -   -   -
```
