# Prototype Protocol Model

Prototype reflection pivots for member signatures, surface resolution, and
option vocabulary.

Contents

**Surface**

- [Member Role](#member-role): Prototype members chip-pivoted by access role.

**All Members**

- [Return Type](#return-type): Prototype members chip-pivoted by return type.
- [Generators](#generators): Prototype generators chip-pivoted by member family.
- [Option Name](#option-name): Prototype members pivoted by option name.
- [Shared Option Type](#shared-option-type): shared Prototype options chip-pivoted by option type.
- [Member Lexeme](#member-lexeme): Prototype members pivoted by shared name lexeme.

**Access Members**

- [Resolution](#resolution): access members pivoted by resolution stage.
- [Split Accessors](#split-accessors): access members pivoted by split-accessor awareness.
- [Access Shape](#access-shape): access members chip-pivoted by singular/plural shape.

## Member Role

```txt
Member Role
├─ set: Prototype members
├─ chip pivot: Access, Remainder
├─ pivot: role
└─ display: role roots with member signatures as leaves
```

```txt
Member Role

Access
├─ Own
│  ├─ *ownKeys(prototype)
│  ├─ hasOwnKey(prototype, key)
│  ├─ getOwnDescriptor(prototype, key)
│  ├─ *ownDescriptors(prototype, { map, filter })
│  └─ *ownValues(prototype, { instance, filter })
├─ Search
│  ├─ *findDescriptors(prototype, key, { reverseHierarchy, map, filter })
│  └─ *findValues(prototype, key, { instance, reverseHierarchy, filter })
└─ Resolve
   ├─ *keys(prototype, {
   │    includeOverridden, reverseHierarchy, splitAccessors, filter })
   ├─ hasKey(prototype, key)
   ├─ hasGetter(prototype, key, { splitAccessors, filter })
   ├─ hasSetter(prototype, key, { splitAccessors, filter })
   ├─ getDescriptor(prototype, key, { splitAccessors, context, filter })
   ├─ *descriptors(prototype, {
   │    includeOverridden, reverseHierarchy, splitAccessors, map, filter })
   ├─ getValue(prototype, key, { instance, splitAccessors, context, filter })
   └─ *values(prototype, {
        instance, includeOverridden, reverseHierarchy, splitAccessors, filter })

Remainder
├─ Build
│  ├─ *deconstruct(prototype)
│  ├─ reduce(links)
│  └─ create(type, basePrototype, descriptors)
├─ Walk
│  └─ *chain(prototype, { reverseHierarchy })
└─ Materialize
   └─ copyTo(prototype, target, { splitAccessors, ... })
```

## Return Type

```txt
Return Type
├─ set: Prototype members
├─ transform: member -> return type
├─ chip pivot: Generator, Prototype, Descriptor, Value, Void, Boolean
└─ display: return type roots with member signatures as leaves
```

```txt
Return Type

Generator
├─ *deconstruct(prototype)
├─ *chain(prototype, { reverseHierarchy })
├─ *ownKeys(prototype)
├─ *keys(prototype, { includeOverridden, reverseHierarchy, splitAccessors, filter })
├─ *ownDescriptors(prototype, { map, filter })
├─ *findDescriptors(prototype, key, { reverseHierarchy, map, filter })
├─ *descriptors(prototype, { includeOverridden, reverseHierarchy, splitAccessors, map, filter })
├─ *ownValues(prototype, { instance, filter })
├─ *findValues(prototype, key, { instance, reverseHierarchy, filter })
└─ *values(prototype, { instance, includeOverridden, reverseHierarchy, splitAccessors, filter })

Prototype
├─ reduce(links)
└─ create(type, basePrototype, descriptors)

Descriptor
├─ getOwnDescriptor(prototype, key)
└─ getDescriptor(prototype, key, { splitAccessors, context, filter })

Value
└─ getValue(prototype, key, { instance, splitAccessors, context, filter })

Void
└─ copyTo(prototype, target, { ... })

Boolean
├─ hasOwnKey(prototype, key)
├─ hasKey(prototype, key)
├─ hasGetter(prototype, key, { splitAccessors, filter })
└─ hasSetter(prototype, key, { splitAccessors, filter })
```

## Generators

```txt
Generators
├─ set: Prototype members
├─ transform: member -> member signature
├─ filter: generator members
├─ chip pivot: Keys, Descriptors, Values
└─ display: generator signatures grouped by chip
```

```txt
Generators

Keys
├─ *ownKeys(prototype)
└─ *keys(prototype, { includeOverridden, reverseHierarchy, splitAccessors, filter })

Descriptors
├─ *ownDescriptors(prototype, { map, filter })
├─ *findDescriptors(prototype, key, { reverseHierarchy, map, filter })
└─ *descriptors(prototype, { includeOverridden, reverseHierarchy, splitAccessors, map, filter })

Values
├─ *ownValues(prototype, { instance, filter })
├─ *findValues(prototype, key, { instance, reverseHierarchy, filter })
└─ *values(prototype, { instance, includeOverridden, reverseHierarchy, splitAccessors, filter })

Remainder
├─ *deconstruct(prototype)
└─ *chain(prototype, { reverseHierarchy })
```

## Option Name

```txt
Option Name
├─ set: Prototype members with options objects
├─ transform: member -> (member, option name)
├─ pivot: option name
├─ sort: option roots by member count descending
└─ display: option roots with member signatures as alphabetical leaves
```

```txt
Option Name

filter
├─ copyTo(prototype, target, { filter })
├─ *descriptors(prototype, { filter })
├─ *findDescriptors(prototype, key, { filter })
├─ getDescriptor(prototype, key, { filter })
├─ getValue(prototype, key, { filter })
├─ hasGetter(prototype, key, { filter })
├─ hasSetter(prototype, key, { filter })
├─ *keys(prototype, { filter })
├─ *ownDescriptors(prototype, { filter })
├─ *ownValues(prototype, { filter })
├─ *values(prototype, { filter })
└─ *findValues(prototype, key, { filter })

reverseHierarchy
├─ *chain(prototype, { reverseHierarchy })
├─ copyTo(prototype, target, { reverseHierarchy })
├─ *descriptors(prototype, { reverseHierarchy })
├─ *findDescriptors(prototype, key, { reverseHierarchy })
├─ *keys(prototype, { reverseHierarchy })
├─ *values(prototype, { reverseHierarchy })
└─ *findValues(prototype, key, { reverseHierarchy })

splitAccessors
├─ copyTo(prototype, target, { splitAccessors })
├─ *descriptors(prototype, { splitAccessors })
├─ getDescriptor(prototype, key, { splitAccessors })
├─ getValue(prototype, key, { splitAccessors })
├─ hasGetter(prototype, key, { splitAccessors })
├─ hasSetter(prototype, key, { splitAccessors })
├─ *keys(prototype, { splitAccessors })
└─ *values(prototype, { splitAccessors })

includeOverridden
├─ copyTo(prototype, target, { includeOverridden })
├─ *descriptors(prototype, { includeOverridden })
├─ *keys(prototype, { includeOverridden })
└─ *values(prototype, { includeOverridden })

map
├─ copyTo(prototype, target, { map })
├─ *descriptors(prototype, { map })
├─ *findDescriptors(prototype, key, { map })
└─ *ownDescriptors(prototype, { map })

instance
├─ getValue(prototype, key, { instance })
├─ *ownValues(prototype, { instance })
├─ *values(prototype, { instance })
└─ *findValues(prototype, key, { instance })

context
├─ getDescriptor(prototype, key, { context })
└─ getValue(prototype, key, { context })

asDescriptor
└─ copyTo(prototype, target, { asDescriptor })

createThunk
└─ copyTo(prototype, target, { createThunk })

filterOwn
└─ copyTo(prototype, target, { filterOwn })

onCopy
└─ copyTo(prototype, target, { onCopy })

onHost
└─ copyTo(prototype, target, { onHost })
```

## Shared Option Type

```txt
Shared Option Type
├─ set: Prototype members with options objects
├─ transform: member -> (member, option name, type)
├─ chip pivot: Boolean, Function, Object
├─ pivot: option name
├─ filter: option count > 1
└─ display: option roots with member signatures grouped by option type
```

```txt
Shared Option Type

Boolean
├─ context
│  ├─ getDescriptor(prototype, key, { splitAccessors, context, filter })
│  └─ getValue(prototype, key, { instance, splitAccessors, context, filter })
├─ includeOverridden
│  ├─ *keys(prototype, { includeOverridden })
│  ├─ *descriptors(prototype, { includeOverridden })
│  ├─ copyTo(prototype, target, { includeOverridden })
│  └─ *values(prototype, { includeOverridden })
├─ reverseHierarchy
│  ├─ *chain(prototype, { reverseHierarchy })
│  ├─ *keys(prototype, { reverseHierarchy })
│  ├─ *findDescriptors(prototype, key, { reverseHierarchy })
│  ├─ *descriptors(prototype, { reverseHierarchy })
│  ├─ copyTo(prototype, target, { reverseHierarchy })
│  ├─ *findValues(prototype, key, { reverseHierarchy })
│  └─ *values(prototype, { reverseHierarchy })
└─ splitAccessors
   ├─ copyTo(prototype, target, { splitAccessors })
   ├─ *descriptors(prototype, { splitAccessors })
   ├─ getDescriptor(prototype, key, { splitAccessors })
   ├─ getValue(prototype, key, { splitAccessors })
   ├─ hasGetter(prototype, key, { splitAccessors })
   ├─ hasSetter(prototype, key, { splitAccessors })
   ├─ *keys(prototype, { splitAccessors })
   └─ *values(prototype, { splitAccessors })

Function
├─ filter
│  ├─ getDescriptor(prototype, key, { filter })
│  ├─ getValue(prototype, key, { filter })
│  ├─ hasGetter(prototype, key, { filter })
│  ├─ hasSetter(prototype, key, { filter })
│  ├─ *keys(prototype, { filter })
│  ├─ *ownDescriptors(prototype, { filter })
│  ├─ *findDescriptors(prototype, key, { filter })
│  ├─ *descriptors(prototype, { filter })
│  ├─ copyTo(prototype, target, { filter })
│  ├─ *ownValues(prototype, { filter })
│  ├─ *findValues(prototype, key, { filter })
│  └─ *values(prototype, { filter })
└─ map
   ├─ *ownDescriptors(prototype, { map })
   ├─ *findDescriptors(prototype, key, { map })
   ├─ *descriptors(prototype, { map })
   └─ copyTo(prototype, target, { map })

Object
└─ instance
   ├─ getValue(prototype, key, { instance })
   ├─ *ownValues(prototype, { instance })
   ├─ *findValues(prototype, key, { instance })
   └─ *values(prototype, { instance })
```

## Member Lexeme

```txt
Member Lexeme
├─ set: Prototype members
├─ transform: member -> (member, lexeme)
├─ pivot: lexeme
├─ chip pivot: count > 1
└─ display: shared lexeme roots, then singleton lexemes under Remainder
```

```txt
Member Lexeme

Descriptor
├─ getDescriptor(prototype, key, { splitAccessors, context, filter })
└─ getOwnDescriptor(prototype, key)

Descriptors
├─ *descriptors(prototype, { includeOverridden, reverseHierarchy, splitAccessors, map, filter })
├─ *findDescriptors(prototype, key, { reverseHierarchy, map, filter })
└─ *ownDescriptors(prototype, { map, filter })

Find
├─ *findDescriptors(prototype, key, { reverseHierarchy, map, filter })
└─ *findValues(prototype, key, { instance, reverseHierarchy, filter })

Get
├─ getDescriptor(prototype, key, { splitAccessors, context, filter })
├─ getOwnDescriptor(prototype, key)
└─ getValue(prototype, key, { instance, splitAccessors, context, filter })

Has
├─ hasGetter(prototype, key, { splitAccessors, filter })
├─ hasOwnKey(prototype, key)
├─ hasSetter(prototype, key, { splitAccessors, filter })
└─ hasKey(prototype, key)

Key
├─ hasOwnKey(prototype, key)
└─ hasKey(prototype, key)

Keys
├─ *ownKeys(prototype)
└─ *keys(prototype, { includeOverridden, reverseHierarchy, splitAccessors, filter })

Own
├─ hasOwnKey(prototype, key)
├─ *ownKeys(prototype)
├─ getOwnDescriptor(prototype, key)
├─ *ownDescriptors(prototype, { map, filter })
└─ *ownValues(prototype, { instance, filter })

Values
├─ *findValues(prototype, key, { instance, reverseHierarchy, filter })
├─ *ownValues(prototype, { instance, filter })
└─ *values(prototype, { instance, includeOverridden, reverseHierarchy, splitAccessors, filter })

Remainder
├─ Chain
│  └─ *chain(prototype, { reverseHierarchy })
├─ Copy
│  └─ copyTo(prototype, target, { ... })
├─ Create
│  └─ create(type, basePrototype, descriptors)
├─ Deconstruct
│  └─ *deconstruct(prototype)
├─ Reduce
│  └─ reduce(links)
└─ To
   └─ copyTo(prototype, target, { ... })
```

## Resolution

```txt
Resolution
├─ set: Prototype access members
├─ transform: member -> (resolution stage, member)
├─ pivot: resolution stage
└─ display: stage roots with member signatures as leaves
```

```txt
Resolution

Own
├─ *ownKeys(prototype)
├─ hasOwnKey(prototype, key)
├─ getOwnDescriptor(prototype, key)
├─ *ownDescriptors(prototype, { map, filter })
└─ *ownValues(prototype, { instance, filter })

Search
├─ *findDescriptors(prototype, key, { reverseHierarchy, map, filter })
└─ *findValues(prototype, key, { instance, reverseHierarchy, filter })

Resolve
├─ *keys(prototype, { includeOverridden, reverseHierarchy, splitAccessors, filter })
├─ hasKey(prototype, key)
├─ hasGetter(prototype, key, { splitAccessors, filter })
├─ hasSetter(prototype, key, { splitAccessors, filter })
├─ getDescriptor(prototype, key, { splitAccessors, context, filter })
├─ *descriptors(prototype, { includeOverridden, reverseHierarchy, splitAccessors, map, filter })
├─ getValue(prototype, key, { instance, splitAccessors, context, filter })
└─ *values(prototype, { instance, includeOverridden, reverseHierarchy, splitAccessors, filter })
```

```txt
Resolution Policy

Own
└─ local prototype link only

Search
└─ hierarchy search without override or split-accessor resolution

Resolve
└─ public surface projection with override suppression
```

## Split Accessors

```txt
Split Accessors
├─ set: Prototype access members
├─ chip pivot: Accepts splitAccessors, Remainder
├─ pivot: resolution stage
└─ display: stage roots with member signatures as leaves
```

```txt
Split Accessors

Accepts splitAccessors
├─ Resolve
│  ├─ *keys(prototype, {
│  │    includeOverridden, reverseHierarchy, splitAccessors, filter })
│  ├─ getDescriptor(prototype, key, { splitAccessors, context, filter })
│  ├─ hasGetter(prototype, key, { splitAccessors, filter })
│  ├─ hasSetter(prototype, key, { splitAccessors, filter })
│  ├─ *descriptors(prototype, {
│  │    includeOverridden, reverseHierarchy, splitAccessors, map, filter })
│  ├─ getValue(prototype, key, { instance, splitAccessors, context, filter })
│  └─ *values(prototype, {
│       instance, includeOverridden, reverseHierarchy, splitAccessors, filter })
└─ Materialize
   └─ copyTo(prototype, target, { splitAccessors, ... })

Remainder
├─ Own
│  ├─ *ownKeys(prototype)
│  ├─ hasOwnKey(prototype, key)
│  ├─ getOwnDescriptor(prototype, key)
│  ├─ *ownDescriptors(prototype, { map, filter })
│  └─ *ownValues(prototype, { instance, filter })
├─ Search
│  ├─ *findDescriptors(prototype, key, { reverseHierarchy, map, filter })
│  └─ *findValues(prototype, key, { instance, reverseHierarchy, filter })
└─ Resolve
   └─ hasKey(prototype, key)
```

## Access Shape

```txt
Access Shape
├─ set: Prototype access members
├─ transform: member -> member signature
├─ chip pivot: OwnXs, Xs, FindXs, GetX, X, OwnX
└─ display: access shape roots with member signatures as leaves
```

```txt
Access Shape

OwnXs
├─ *ownDescriptors(prototype, { map, filter })
├─ *ownKeys(prototype)
└─ *ownValues(prototype, { instance, filter })

Xs
├─ *descriptors(prototype, { includeOverridden, reverseHierarchy, splitAccessors, map, filter })
├─ *keys(prototype, { includeOverridden, reverseHierarchy, splitAccessors, filter })
└─ *values(prototype, { instance, includeOverridden, reverseHierarchy, splitAccessors, filter })

FindXs
├─ *findDescriptors(prototype, key, { reverseHierarchy, map, filter })
└─ *findValues(prototype, key, { instance, reverseHierarchy, filter })

GetX
├─ getDescriptor(prototype, key, { splitAccessors, context, filter })
└─ getValue(prototype, key, { instance, splitAccessors, context, filter })

X
├─ hasGetter(prototype, key, { splitAccessors, filter })
├─ hasKey(prototype, key)
└─ hasSetter(prototype, key, { splitAccessors, filter })

OwnX
├─ getOwnDescriptor(prototype, key)
└─ hasOwnKey(prototype, key)
```
