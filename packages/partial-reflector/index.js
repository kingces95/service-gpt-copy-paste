import { assert } from '@kingjs/assert'
import { isAbstract } from '@kingjs/abstract'
import { Es6Prototype } from '@kingjs/es6-prototype'
import { Es6Reflector } from '@kingjs/es6-reflector'
import { PartialLoader } from '@kingjs/partial-loader'
import { PartialType } from '@kingjs/partial-type'
import { 
  Implements, 
  Extends,
  Compile,
  Declarations,
  Thunk, 
  Preconditions, 
  Postconditions,
  TypePrecondition, 
  TypePostcondition,
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
  Implements, Extends,
  Thunk, 
  Preconditions, Postconditions,
  TypePrecondition, TypePostcondition,
  // TODO: remove Compile, Declarations, Symbol.hasInstance
  Compile, 'Compile',
  Declarations, 'Declarations',
  Symbol.hasInstance,
]

export class PartialReflector extends Es6Reflector {
  constructor() {
    super({
      knownTypes: KnownTypes, 
      knownTypeFn: type => Object.getPrototypeOf(type) === PartialType,
      knownKeys: KnownKeys,
      knownStaticKeys: KnownStaticKeys,
      // TODO: suppress caching transparent prototypes?
      getPrototypeFn: function createPrototype(type) {
        const hierarchy = [...PartialLoader.hierarchy(type)]
        
        return hierarchy.reduce((prototype, currentType) => {
          const descriptors = { }

          let ownKey
          for (const current of PartialLoader.ownDescriptors(currentType)) {
            assert(typeof current == 'object'
              || typeof current == 'string' 
              || typeof current == 'symbol',
              `Unexpected type: ${typeof current}`)

            switch (typeof current) {
              case 'string':
              case 'symbol':
                ownKey = current 
              break
              case 'object':
                // inherit existing descriptor if current is abstract
                if (isAbstract(current)) {
                  const existing = descriptors[ownKey]
                  if (existing && !isAbstract(existing))
                    current = existing
                }
                descriptors[ownKey] = current
                break
            }
          }

          return Es6Prototype.createLink(currentType, prototype, descriptors)
        }, null)
      },
    })
  }

  *getPreconditions(type, key) {
    yield *this.getMetadataPrototype(type, Preconditions)
      .getDescriptor(type, key)
  }
  *getPostconditions(type, key) {
    yield *this.getMetadataPrototype(type, Postconditions)
      .getDescriptor(type, key)
  } 
}
