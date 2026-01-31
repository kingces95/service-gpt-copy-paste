import { assert } from '@kingjs/assert'
import { UserReflect } from '@kingjs/user-reflect'
import { PartialAssociate } from '@kingjs/partial-associate'
import { PartialLoader } from '@kingjs/partial-loader'

// Creates an empty "prototypical" class that extends Prototypical
// and merges the given partial object type into it. This allows
// us to reflect over the merged result so the reflection layer can
// faithfully report what the loader (merge) actually did.

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

const PrototypicalHostMap = new Map()
const PrototypicalTypeMap = new Map()

function getPrototypicalType(type) {
  assert(PartialLoader.isPartialObject(type))
  let prototypicalType = PrototypicalTypeMap.get(type)
  if (!prototypicalType) {
    prototypicalType = prototypicalCreate(type)
    PrototypicalTypeMap.set(type, prototypicalType)
    PrototypicalHostMap.set(prototypicalType, type)
    PrototypicalHostMap.set(
      Object.getPrototypeOf(prototypicalType), type)
  }
  return prototypicalType
}

function getPrototypicalHost(type) {
  if (!(type.prototype instanceof Prototypical)) return type
  return PrototypicalHostMap.get(type)
}

const Declarations = Symbol.for('PartialReflect.Declarations')

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
        case 'function': yield getPrototypicalHost(current); break
        default: yield current
      }
    }    
  }
  
  static *getDescriptor(type, key) {
    assert(PartialLoader.isPartialObject(type))
    let owner = null
    for (const current of UserReflect.getDescriptor(
      getPrototypicalType(type), key)) {
      switch (typeof current) {
        case 'function': owner = current; break
        case 'object':
          yield getPrototypicalHost(owner)
          return yield current
        default: assert(false, `Unexpected type: ${typeof current}`)
      }
    }
  }

  static *descriptors(type) {
    assert(PartialLoader.isPartialObject(type))
    for (const current of UserReflect.descriptors(
      getPrototypicalType(type))) {
      switch (typeof current) {
        case 'function': 
          yield getPrototypicalHost(current) 
          break
        case 'string':
        case 'symbol': 
        case 'object': yield current; break
        default: assert(false, `Unexpected type: ${typeof current}`)
      }
    }
  }
}
