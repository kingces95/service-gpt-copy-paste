import { Es6Reflector } from '@kingjs/es6-reflector'
import { createPrototype } from '@kingjs/partial-loader'
import { PartialType } from '@kingjs/partial-type'
import { 
  Implements, 
  Extends,
  Compile,
  Declarations,
  Define,
  Transparent,
  Thunk, 
} from '@kingjs/partial-symbols'

// Unfies reflection operations over PartialType and Es6 types which
// may have been merged with vairous PartialTypes (i.e.PartialClass,
// Concept, etc.). For example, 

// *PartialReflect.baseTypes(type)
//    Returns the base types of a type. Since a type may have multiple base
//    types they are returned in the reverse order they were merged.
//    For example, if a type extends a base type and a concept, baseTypes 
//    will return the Concept followed by the base type.  

// *PartialReflect.keys(type, { includeOverridden })
//    Returns all keys of a type including keys of PartialTypes and Es6 types. 
//    If includeOverridden is false, overridden keys are not included. If
//    includeOverridden is true, overridden keys are included and associated
//    with the type that defined them (i.e. hosts).

// *PartialReflect.hosts(type, key)
//    Returns all types that defined or were overridden defining a member 
//    with the key.

// etc.

const KnownTypes = [ Object, Function, PartialType ]
const KnownKeys = [ 'constructor' ]
const KnownStaticKeys = [ 'length', 'name', 'prototype',
  Implements, 
  Extends,
  Thunk, 
  Transparent,
  Define,
  Compile, 
  Declarations, 
  Symbol.hasInstance,
]

export const PartialReflect = Es6Reflector.create({
  knownTypes: KnownTypes, 
  knownTypeFn: type => Object.getPrototypeOf(type) === PartialType,
  knownKeys: KnownKeys,
  knownStaticKeys: KnownStaticKeys,
  // TODO: suppress caching transparent prototypes?
  getPrototypeFn: createPrototype,
})
