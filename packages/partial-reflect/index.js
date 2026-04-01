import { 
  PartialType, 
  Thunk, Preconditions, Postconditions,
  TypePrecondition, TypePostcondition,
  Prototype } from '@kingjs/partial-type'
import { Es6UserReflect } from '@kingjs/es6-user-reflect'
import { Es6Reflector } from '@kingjs/es6-reflector'
import { getPrototype as getPartialPrototype } from '@kingjs/partial-prototype'
import { PartialClass } from '@kingjs/partial-class'
import { Concept, ImplicitConcept } from '@kingjs/concept'
import { Extensions } from '@kingjs/extensions'

// Unfies reflection operations over PartialType and Es6 types which
// may have been merged with vairous PartialTypes (i.e.PartialClass,
// Concept, etc.). For example, 

//  *PartialReflect.baseTypes(type)
//    Returns all base types of a type including PartialTypes and Es6 types.

// *PartialReflect.partialTypes(type)
//    Returns all base types filtered to only include PartialTypes.

// *PartialReflect.hosts(type, key)
//    Returns all types that defined or considered defining a member 
//    with the key (i.e. keys that were overridden).

// *PartialReflect.keys(type, { includeOverridden })
//    Returns all keys of a type including keys of PartialTypes and Es6 types. 
//    If includeOverridden is false, overridden keys are not included. If
//    includeOverridden is true, overridden keys are included and associated
//    with the type that defined them (i.e. hosts).

// *baseTypes(type)
//    Returns the base types of a type. Since a type may have multiple base
//    types they are returned in the reverse order they were merged.
//    For example, if a type extends a base type and a concept, baseTypes 
//    will return the Concept followed by the base type.  

// etc.

const KnownTypes = [ Object, Function, 
  PartialType, Concept, ImplicitConcept, Extensions, PartialClass ]
const KnownInstanceKeys = [ 'constructor' ]
const KnownStaticKeys = [ 'length', 'name', 'prototype',
  Thunk, 
  Preconditions, Postconditions,
  TypePrecondition, TypePostcondition,
  Prototype,
  // TODO: remove Compile, Declarations, Symbol.hasInstance
  PartialType.Compile, 'Compile',
  PartialType.Declarations, 'Declarations',
  Symbol.hasInstance,
]

class PartialReflector extends Es6Reflector { 
  constructor() {
    super({
      knownTypes: KnownTypes,
      knownInstanceKeys: KnownInstanceKeys,
      knownStaticKeys: KnownStaticKeys,
      getPrototypeFn: type => getPartialPrototype(type),
    })
  }

  getPartialType(type) {
    let current = type
    while (current = Es6UserReflect.getBaseType(current)) {
      if (Es6UserReflect.getBaseType(current) == PartialType)
        return current
    }
    return null
  }

  isPartialType(type) { return this.getPartialType(type) != null }
  isPartialClass(type) { return this.getPartialType(type) == PartialClass }
  isConcept(type) { return this.getPartialType(type) == Concept }
  isExtension(type) { return this.getPartialType(type) == Extensions }

  *partialTypes(type) {
    for (const current of this.baseTypes(type)) {
      if (!this.isPartialType(current)) continue
      yield current
    }
  }

  *partialClasses(type) {
    for (const current of this.baseTypes(type)) {
      if (!this.isPartialClass(current)) continue
      yield current
    }
  }

  *concepts(type) {
    for (const current of this.baseTypes(type)) {
      if (!this.isConcept(current)) continue
      yield current
    }
  }
}

export const PartialReflect = new PartialReflector()

export function isKey(key) {
  return typeof key === 'string' || typeof key === 'symbol'
}
