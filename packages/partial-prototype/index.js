import { assert } from '@kingjs/assert'
import { UserReflect } from '@kingjs/user-reflect'
import { PartialAssociate } from '@kingjs/partial-associate'
import { PartialLoader } from '@kingjs/partial-loader'

// Creates an empty "prototypical" class that extends Prototypical
// and merges a given partial object type into it. This allows
// reflection over the merged result which will faithfully report 
// what the loader (PartialLoader.merge) actually did.

function defineName(type, name) {
  Object.defineProperties(type, {
    name: {
      value: name,
      configurable: true,
      enumerable: false,
      writable: false,
    }
  })
}

class Prototypical { }

function prototypicalCreate(type) {
  let prototypicalType = class extends Prototypical { }
  defineName(prototypicalType, '$prototypical_' + type.name)

  PartialLoader.merge(prototypicalType, type, { 
    // HACK: A PartialObject should not report being merged with itself.
    isTransparent: true,
    parentType: type
  })
  
  return prototypicalType
}

const PrototypicalTypeMap = new Map()

function getPrototypicalType(type) {
  assert(PartialLoader.isPartialObject(type))
  let prototypicalType = PrototypicalTypeMap.get(type)

  if (!prototypicalType) {
    prototypicalType = prototypicalCreate(type)
    PrototypicalTypeMap.set(type, prototypicalType)
  }
  
  return prototypicalType
}

export class PartialPrototype {

  static *partialObjects(type) {
    assert(PartialLoader.isPartialObject(type))
    type = getPrototypicalType(type)
    yield* PartialAssociate.partialObjects(type)
  }

  // returns partial classes that could have defined the key
  // for example, all concepts that defined the key
  static *hosts(type, key) {
    assert(PartialLoader.isPartialObject(type))
    type = getPrototypicalType(type)
    yield* PartialAssociate.hosts(type, key)
  }
  
  static getHost(type, key) {
    assert(PartialLoader.isPartialObject(type))
    type = getPrototypicalType(type)
    return PartialAssociate.getHost(type, key)
  }

  static *keys(type) { 
    assert(PartialLoader.isPartialObject(type))
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
    assert(PartialLoader.isPartialObject(type))
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
    assert(PartialLoader.isPartialObject(type))
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
