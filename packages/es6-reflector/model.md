# Es6 Reflector Model

Es6Reflector models the split between lexical JavaScript inheritance and
reflected runtime composition.

Contents

- [Role](#role): Es6Reflector members pivoted by reflection role.
- [Surface Origin](#surface-origin): Es6Reflector members chip-pivoted by implementation host.
- [Option Index](#option-index): Es6Reflector options pivoted by option, origin, and role.
- [Lexeme](#lexeme): Es6Reflector members pivoted by name lexeme.

## Role

```txt
Role
├─ set: Es6Reflector members
├─ transform: member -> role
├─ pivot: role
└─ display: role roots with member signatures as leaves
```

```txt
Role

Construct
├─ create({
│    knownTypes, knownTypeFn,
│    knownKeys, knownKeyFn,
│    knownStaticKeys, knownStaticKeyFn,
│    getPrototype, splitAccessors })
└─ map({ knownTypes, knownTypeFn, knownKeys, knownKeyFn,
     getPrototype, splitAccessors })

Lexical
├─ isExtensionOf(type, targetType)
├─ *extensions(type)
├─ getExtendedType(type)
└─ isAbstract(type)

Composition
├─ *composition(type, { filter, reverseHierarchy })
├─ *components(type, { filter })
├─ getComponent(type)
└─ isComposedOf(type, targetType)

Descriptor
├─ typeof(type, key, descriptor, { isStatic })
├─ getOwnDescriptor(type, key, { isStatic, descriptorType })
├─ *ownDescriptors(type, { isStatic, descriptorType })
├─ getDescriptor(type, key, { isStatic, descriptorType, context })
├─ *findDescriptors(type, key, { isStatic, descriptorType, reverseHierarchy })
└─ *descriptors(type, {
     isStatic, descriptorType, includeOverridden, reverseHierarchy })

Key
├─ isKnown(type, { isStatic })
├─ isKnownKey(type, key, { isStatic })
├─ hasOwnKey(type, key, { isStatic })
├─ hasKey(type, key, { isStatic })
├─ hasGetter(type, key, { isStatic, descriptorType })
├─ hasSetter(type, key, { isStatic, descriptorType })
├─ *ownKeys(type, { isStatic })
└─ *keys(type, { isStatic, includeOverridden, reverseHierarchy })

Value
├─ *ownValues(type, { isStatic, descriptorType, extensionOf, instanceOf })
├─ getValue(type, key, {
│    isStatic, descriptorType, extensionOf, instanceOf, context })
├─ *findValues(type, key, {
│    isStatic, includeOverridden, descriptorType,
│    extensionOf, instanceOf, reverseHierarchy })
└─ *values(type, {
     isStatic, includeOverridden, descriptorType,
     extensionOf, instanceOf, reverseHierarchy })

Materialize
├─ getPrototype(type, { isStatic })
├─ copyTo(type, target, { isStatic, ... })
└─ reduce(mergeOrder, { isStatic, ... })

Probe
├─ canDuckCast(type, instance)
└─ canStrictDuckCast(type, instance)
```

## Surface Origin

```txt
Surface Origin
├─ set: Es6Reflector members
├─ chip pivot: Es6Prototype, Es6Reflector
├─ pivot: origin, role
└─ display: origin roots with role roots and member signatures as leaves
```

```txt
Surface Origin

Es6Prototype
├─ Composition
│  ├─ getComponent(type)
│  └─ isComposedOf(type, targetType)
├─ Key
│  ├─ isKnown(type, { isStatic })
│  ├─ isKnownKey(type, key, { isStatic })
│  ├─ hasOwnKey(type, key, { isStatic })
│  ├─ hasKey(type, key, { isStatic })
│  ├─ hasGetter(type, key, { isStatic, descriptorType })
│  ├─ hasSetter(type, key, { isStatic, descriptorType })
│  ├─ *ownKeys(type, { isStatic })
│  └─ *keys(type, { isStatic, includeOverridden, reverseHierarchy })
├─ Descriptor
│  ├─ getOwnDescriptor(type, key, { isStatic, descriptorType })
│  ├─ *ownDescriptors(type, { isStatic, descriptorType })
│  ├─ getDescriptor(type, key, { isStatic, descriptorType, context })
│  ├─ *findDescriptors(type, key, { isStatic, descriptorType, reverseHierarchy })
│  └─ *descriptors(type, {
│       isStatic, descriptorType, includeOverridden, reverseHierarchy })
├─ Materialize
│  ├─ getPrototype(type, { isStatic })
│  ├─ copyTo(type, target, { isStatic, ... })
│  └─ reduce(mergeOrder, { isStatic, ... })
└─ Probe
   ├─ canDuckCast(type, instance)
   └─ canStrictDuckCast(type, instance)

Es6Reflector
├─ Construct
│  ├─ create({
│  │    knownTypes, knownTypeFn,
│  │    knownKeys, knownKeyFn,
│  │    knownStaticKeys, knownStaticKeyFn,
│  │    getPrototype, splitAccessors })
│  └─ map({ knownTypes, knownTypeFn, knownKeys, knownKeyFn,
│       getPrototype, splitAccessors })
├─ Lexical
│  ├─ isExtensionOf(type, targetType)
│  ├─ *extensions(type)
│  ├─ getExtendedType(type)
│  └─ isAbstract(type)
├─ Composition
│  ├─ *composition(type, { filter, reverseHierarchy })
│  └─ *components(type, { filter })
├─ Descriptor
│  └─ typeof(type, key, descriptor, { isStatic })
└─ Value
   ├─ *ownValues(type, { isStatic, descriptorType, extensionOf, instanceOf })
   ├─ getValue(type, key, {
   │    isStatic, descriptorType, extensionOf, instanceOf, context })
   ├─ *findValues(type, key, {
   │    isStatic, includeOverridden, descriptorType,
   │    extensionOf, instanceOf, reverseHierarchy })
   └─ *values(type, {
        isStatic, includeOverridden, descriptorType,
        extensionOf, instanceOf, reverseHierarchy })
```

## Option Index

```txt
Option Index
├─ set: Es6Reflector member options
├─ transform: option -> (option, origin, role, member)
├─ pivot: option, origin, role
└─ display: option roots with origin roots, role roots, and member leaves
```

```txt
Option Index

context
├─ Es6Prototype
│  └─ Descriptor
│     └─ getDescriptor(type, key)
└─ Es6Reflector
   └─ Value
      └─ getValue(type, key)

descriptorType
├─ Es6Prototype
│  ├─ Key
│  │  ├─ hasGetter(type, key)
│  │  └─ hasSetter(type, key)
│  └─ Descriptor
│     ├─ getOwnDescriptor(type, key)
│     ├─ *ownDescriptors(type)
│     ├─ getDescriptor(type, key)
│     ├─ *findDescriptors(type, key)
│     └─ *descriptors(type)
└─ Es6Reflector
   └─ Value
      ├─ *ownValues(type)
      ├─ getValue(type, key)
      ├─ *findValues(type, key)
      └─ *values(type)

extensionOf
└─ Es6Reflector
   └─ Value
      ├─ *ownValues(type)
      ├─ getValue(type, key)
      ├─ *findValues(type, key)
      └─ *values(type)

filter
└─ Es6Reflector
   └─ Composition
      ├─ *composition(type)
      └─ *components(type)

getPrototype
└─ Es6Reflector
   └─ Construct
      ├─ create({ ... })
      └─ map({ ... })

includeOverridden
├─ Es6Prototype
│  ├─ Key
│  │  └─ *keys(type)
│  └─ Descriptor
│     └─ *descriptors(type)
└─ Es6Reflector
   └─ Value
      ├─ *findValues(type, key)
      └─ *values(type)

instanceOf
└─ Es6Reflector
   └─ Value
      ├─ *ownValues(type)
      ├─ getValue(type, key)
      ├─ *findValues(type, key)
      └─ *values(type)

isStatic
├─ Es6Prototype
│  ├─ Key
│  │  ├─ isKnown(type)
│  │  ├─ isKnownKey(type, key)
│  │  ├─ hasOwnKey(type, key)
│  │  ├─ hasKey(type, key)
│  │  ├─ hasGetter(type, key)
│  │  ├─ hasSetter(type, key)
│  │  ├─ *ownKeys(type)
│  │  └─ *keys(type)
│  ├─ Descriptor
│  │  ├─ getOwnDescriptor(type, key)
│  │  ├─ *ownDescriptors(type)
│  │  ├─ getDescriptor(type, key)
│  │  ├─ *findDescriptors(type, key)
│  │  └─ *descriptors(type)
│  └─ Materialize
│     ├─ getPrototype(type)
│     ├─ copyTo(type, target)
│     └─ reduce(mergeOrder)
└─ Es6Reflector
   ├─ Descriptor
   │  └─ typeof(type, key, descriptor)
   └─ Value
      ├─ *ownValues(type)
      ├─ getValue(type, key)
      ├─ *findValues(type, key)
      └─ *values(type)

knownKeys
└─ Es6Reflector
   └─ Construct
      ├─ create({ ... })
      └─ map({ ... })

knownKeyFn
└─ Es6Reflector
   └─ Construct
      ├─ create({ ... })
      └─ map({ ... })

knownStaticKeys
└─ Es6Reflector
   └─ Construct
      └─ create({ ... })

knownStaticKeyFn
└─ Es6Reflector
   └─ Construct
      └─ create({ ... })

knownTypes
└─ Es6Reflector
   └─ Construct
      ├─ create({ ... })
      └─ map({ ... })

knownTypeFn
└─ Es6Reflector
   └─ Construct
      ├─ create({ ... })
      └─ map({ ... })

reverseHierarchy
├─ Es6Prototype
│  ├─ Key
│  │  └─ *keys(type)
│  └─ Descriptor
│     ├─ *findDescriptors(type, key)
│     └─ *descriptors(type)
└─ Es6Reflector
   ├─ Composition
   │  └─ *composition(type)
   └─ Value
      ├─ *findValues(type, key)
      └─ *values(type)

splitAccessors
└─ Es6Reflector
   └─ Construct
      ├─ create({ ... })
      └─ map({ ... })
```

## Lexeme

```txt
Lexeme
├─ set: Es6Reflector member names
├─ transform: member name -> (member name, lexeme)
├─ pivot: lexeme
└─ display: lexeme roots with member names as leaves
```

```txt
Lexeme

Abstract
└─ isAbstract

Can
├─ canDuckCast
└─ canStrictDuckCast

Cast
├─ canDuckCast
└─ canStrictDuckCast

Component
└─ getComponent

Components
└─ components

Composed
└─ isComposedOf

Composition
└─ composition

Copy
└─ copyTo

Create
└─ create

Descriptor
├─ getOwnDescriptor
└─ getDescriptor

Descriptors
├─ ownDescriptors
├─ findDescriptors
└─ descriptors

Duck
├─ canDuckCast
└─ canStrictDuckCast

Extended
└─ getExtendedType

Extension
└─ isExtensionOf

Extensions
└─ extensions

Find
├─ findDescriptors
└─ findValues

Get
├─ getExtendedType
├─ getPrototype
├─ getComponent
├─ getOwnDescriptor
├─ getDescriptor
└─ getValue

Getter
└─ hasGetter

Has
├─ hasOwnKey
├─ hasKey
├─ hasGetter
└─ hasSetter

Is
├─ isExtensionOf
├─ isAbstract
├─ isComposedOf
├─ isKnown
└─ isKnownKey

Key
├─ isKnownKey
├─ hasOwnKey
├─ hasKey
├─ ownKeys
└─ keys

Known
├─ isKnown
└─ isKnownKey

Map
└─ map

Of
├─ isExtensionOf
└─ isComposedOf

Own
├─ hasOwnKey
├─ ownKeys
├─ getOwnDescriptor
├─ ownDescriptors
└─ ownValues

Prototype
└─ getPrototype

Reduce
└─ reduce

Setter
└─ hasSetter

Strict
└─ canStrictDuckCast

To
└─ copyTo

Type
└─ getExtendedType

Typeof
└─ typeof

Value
└─ getValue

Values
├─ ownValues
├─ findValues
└─ values
```
