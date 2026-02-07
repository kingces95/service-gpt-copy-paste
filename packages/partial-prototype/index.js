import { assert } from '@kingjs/assert'
import { UserReflect } from '@kingjs/user-reflect'
import { PartialAssociate } from '@kingjs/partial-associate'
import { PartialTypeReflect } from '@kingjs/partial-type'
import { extend } from '@kingjs/partial-extend'

// Creates an empty "prototypical" class that extends Prototypical
// and merges a given partial object type into it. This allows
// reflection over the merged result which will faithfully report 
// what the loader (extend) actually did.

class Prototypical { }

function prototypicalCreate(type) {
  let prototypicalType = class extends Prototypical { }
  Object.defineProperties(prototypicalType, {
    name: {
      value: '$prototypical_' + type.name,
      configurable: true,
      enumerable: false,
      writable: false,
    }
  })

  extend(prototypicalType, type, { 
    // HACK: A PartialType should not report being merged with itself.
    isTransparent: true,
    parentType: type
  })
  
  return prototypicalType
}

const PrototypicalTypeMap = new Map()

function getPrototypicalType(type) {
  assert(PartialTypeReflect.isPartialType(type))
  let prototypicalType = PrototypicalTypeMap.get(type)

  if (!prototypicalType) {
    prototypicalType = prototypicalCreate(type)
    PrototypicalTypeMap.set(type, prototypicalType)
  }
  
  return prototypicalType
}

export class PartialPrototype {

  static *partialExtensions(type) {
    assert(PartialTypeReflect.isPartialType(type))
    type = getPrototypicalType(type)
    yield* PartialAssociate.partialExtensions(type)
  }

  // returns partial classes that could have defined the key
  // for example, all concepts that defined the key
  static *abstractHosts(type, key) {
    assert(PartialTypeReflect.isPartialType(type))
    type = getPrototypicalType(type)
    yield* PartialAssociate.abstractHosts(type, key)
  }
  
  static getHost(type, key) {
    assert(PartialTypeReflect.isPartialType(type))
    type = getPrototypicalType(type)
    return PartialAssociate.getHost(type, key)
  }

  static *keys(type) { 
    assert(PartialTypeReflect.isPartialType(type))
    const prototypicalType = getPrototypicalType(type)
    for (const current of UserReflect.keys(prototypicalType)) {
      switch (typeof current) {
        case 'function': 
          yield current == prototypicalType ? type : current
          break
        default: yield current
      }
    }    
  }
  
  static *getDescriptor(type, key) {
    assert(PartialTypeReflect.isPartialType(type))
    let owner = null
    const prototypicalType = getPrototypicalType(type)
    for (const current of UserReflect.getDescriptor(prototypicalType, key)) {
      switch (typeof current) {
        case 'function': owner = current; break
        case 'object':
          yield owner == prototypicalType ? type : owner
          return yield current
        default: assert(false, `Unexpected type: ${typeof current}`)
      }
    }
  }

  static *descriptors(type) {
    assert(PartialTypeReflect.isPartialType(type))
    const prototypicalType = getPrototypicalType(type)
    for (const current of UserReflect.descriptors(prototypicalType)) {
      switch (typeof current) {
        case 'function': 
          yield current == prototypicalType ? type : current
          break
        case 'string':
        case 'symbol': 
        case 'object': yield current; break
        default: assert(false, `Unexpected type: ${typeof current}`)
      }
    }
  }
}
