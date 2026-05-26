# Prototype Protocol Model

Prototype reflection pivots for member signatures and option vocabulary.

Contents

**Surface**

- [Member Role](#member-role): Prototype members pivoted by fuzzy behavior role.
- [Return Type](#return-type): Prototype members chip-pivoted by return type.
- [Generators](#generators): Prototype generators chip-pivoted by member family.
- [Access Shape](#access-shape): Prototype access members chip-pivoted by singular/plural shape.
- [Option Name](#option-name): Prototype members pivoted by option name.
- [Shared Option Type](#shared-option-type): shared Prototype options chip-pivoted by option type.
- [Member Lexeme](#member-lexeme): Prototype members pivoted by shared name lexeme.

## Member Role

```txt
Member Role
├─ set: Prototype members
├─ transform: member -> (role, member)
├─ pivot: role
└─ display: role roots with member signatures as leaves
```

```txt
Member Role

Build
├─ *deconstruct(prototype)
├─ reduce(links)
└─ create(type, basePrototype, descriptors)

Walk
└─ *chain(prototype, { reverseHierarchy })

Keys
├─ hasOwnKey(prototype, key)
├─ hasKey(prototype, key)
├─ *ownKeys(prototype)
└─ *keys(prototype, { includeOverridden, reverseHierarchy, filter })

Descriptors
├─ getOwnDescriptor(prototype, key)
├─ findDescriptor(prototype, key, { context })
├─ *ownDescriptors(prototype, { map, filter })
├─ *findDescriptors(prototype, key, { reverseHierarchy, map, filter })
└─ *descriptors(prototype, { includeOverridden, reverseHierarchy, map, filter })

Values
├─ *ownValues(prototype, { instance, filter })
├─ findValue(prototype, key, { instance, context })
├─ *findValues(prototype, key, { instance, reverseHierarchy, filter })
└─ *values(prototype, { instance, includeOverridden, reverseHierarchy, filter })

Copy
└─ copyTo(prototype, target, { ... })
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
├─ *keys(prototype, { includeOverridden, reverseHierarchy, filter })
├─ *ownDescriptors(prototype, { map, filter })
├─ *findDescriptors(prototype, key, { reverseHierarchy, map, filter })
├─ *descriptors(prototype, { includeOverridden, reverseHierarchy, map, filter })
├─ *ownValues(prototype, { instance, filter })
├─ *findValues(prototype, key, { instance, reverseHierarchy, filter })
└─ *values(prototype, { instance, includeOverridden, reverseHierarchy, filter })

Prototype
├─ reduce(links)
└─ create(type, basePrototype, descriptors)

Descriptor
├─ getOwnDescriptor(prototype, key)
└─ findDescriptor(prototype, key, { context })

Value
└─ findValue(prototype, key, { instance, context })

Void
└─ copyTo(prototype, target, { ... })

Boolean
├─ hasOwnKey(prototype, key)
└─ hasKey(prototype, key)
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
└─ *keys(prototype, { includeOverridden, reverseHierarchy, filter })

Descriptors
├─ *ownDescriptors(prototype, { map, filter })
├─ *findDescriptors(prototype, key, { reverseHierarchy, map, filter })
└─ *descriptors(prototype, { includeOverridden, reverseHierarchy, map, filter })

Values
├─ *ownValues(prototype, { instance, filter })
├─ *findValues(prototype, key, { instance, reverseHierarchy, filter })
└─ *values(prototype, { instance, includeOverridden, reverseHierarchy, filter })

Remainder
├─ *deconstruct(prototype)
└─ *chain(prototype, { reverseHierarchy })
```

## Access Shape

```txt
Access Shape
├─ set: Prototype members
├─ transform: member -> member signature
├─ filter: role in Key, Descriptor, Value
├─ chip pivot: OwnXs, Xs, FindXs, FindX, X, OwnX
└─ display: access shape roots with member signatures as leaves
```

```txt
Access Shape

OwnXs
├─ *ownDescriptors(prototype, { map, filter })
├─ *ownKeys(prototype)
└─ *ownValues(prototype, { instance, filter })

Xs
├─ *descriptors(prototype, { includeOverridden, reverseHierarchy, map, filter })
├─ *keys(prototype, { includeOverridden, reverseHierarchy, filter })
└─ *values(prototype, { instance, includeOverridden, reverseHierarchy, filter })

FindXs
├─ *findDescriptors(prototype, key, { reverseHierarchy, map, filter })
└─ *findValues(prototype, key, { instance, reverseHierarchy, filter })

FindX
├─ findDescriptor(prototype, key, { context })
└─ findValue(prototype, key, { instance, context })

X
└─ hasKey(prototype, key)

OwnX
├─ getOwnDescriptor(prototype, key)
└─ hasOwnKey(prototype, key)
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
├─ findValue(prototype, key, { instance })
├─ *ownValues(prototype, { instance })
├─ *values(prototype, { instance })
└─ *findValues(prototype, key, { instance })

context
├─ findDescriptor(prototype, key, { context })
└─ findValue(prototype, key, { context })

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
│  ├─ findDescriptor(prototype, key, { context })
│  └─ findValue(prototype, key, { context })
├─ includeOverridden
│  ├─ *keys(prototype, { includeOverridden })
│  ├─ *descriptors(prototype, { includeOverridden })
│  ├─ copyTo(prototype, target, { includeOverridden })
│  └─ *values(prototype, { includeOverridden })
└─ reverseHierarchy
   ├─ *chain(prototype, { reverseHierarchy })
   ├─ *keys(prototype, { reverseHierarchy })
   ├─ *findDescriptors(prototype, key, { reverseHierarchy })
   ├─ *descriptors(prototype, { reverseHierarchy })
   ├─ copyTo(prototype, target, { reverseHierarchy })
   ├─ *findValues(prototype, key, { reverseHierarchy })
   └─ *values(prototype, { reverseHierarchy })

Function
├─ filter
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
├─ findDescriptor(prototype, key, { context })
└─ getOwnDescriptor(prototype, key)

Descriptors
├─ *descriptors(prototype, { includeOverridden, reverseHierarchy, map, filter })
├─ *findDescriptors(prototype, key, { reverseHierarchy, map, filter })
└─ *ownDescriptors(prototype, { map, filter })

Find
├─ findDescriptor(prototype, key, { context })
├─ *findDescriptors(prototype, key, { reverseHierarchy, map, filter })
├─ findValue(prototype, key, { instance, context })
└─ *findValues(prototype, key, { instance, reverseHierarchy, filter })

Has
├─ hasOwnKey(prototype, key)
└─ hasKey(prototype, key)

Key
├─ hasOwnKey(prototype, key)
└─ hasKey(prototype, key)

Keys
├─ *ownKeys(prototype)
└─ *keys(prototype, { includeOverridden, reverseHierarchy, filter })

Own
├─ hasOwnKey(prototype, key)
├─ *ownKeys(prototype)
├─ getOwnDescriptor(prototype, key)
├─ *ownDescriptors(prototype, { map, filter })
└─ *ownValues(prototype, { instance, filter })

Values
├─ *findValues(prototype, key, { instance, reverseHierarchy, filter })
├─ *ownValues(prototype, { instance, filter })
└─ *values(prototype, { instance, includeOverridden, reverseHierarchy, filter })

Remainder
├─ Chain
│  └─ *chain(prototype, { reverseHierarchy })
├─ Copy
│  └─ copyTo(prototype, target, { ... })
├─ Create
│  └─ create(type, basePrototype, descriptors)
├─ Deconstruct
│  └─ *deconstruct(prototype)
├─ Get
│  └─ getOwnDescriptor(prototype, key)
├─ Reduce
│  └─ reduce(links)
├─ To
│  └─ copyTo(prototype, target, { ... })
└─ Value
   └─ findValue(prototype, key, { instance, context })
```