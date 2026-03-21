import { assert } from '@kingjs/assert'
import { PartialAssociate } from '@kingjs/partial-associate'
import { PartialLoader } from '@kingjs/partial-loader'
import { PartialPrototype } from '@kingjs/partial-prototype'
import { Es6UserReflect } from '@kingjs/es6-user-reflect'
import { PartialTypeReflect } from '@kingjs/partial-type'

// Unfies reflection operations over PartialObjects and Es6 types.

// PartialType reflection is dispatched to PartialLoader/PartialPrototype
// while Es6 type reflection is dispatched to UserReflect.

// Known types/keys are filtered out. 

// The set of known types includes all Es6 built-in types (e.g. Object, 
// Array, Function, etc) as well as PartialType and all types that 
// directly extend PartialType (i.e. Extensions, PartialClass, etc).

// Known keys include all keys defined on known types as well as some
// Es6 keys like 'length' and 'constructor' which are automatically
// defined on functions.

// Load() enters the monade. Load returns the type except when the type
// is a pojo, in which case an anonymous PartialType type is created
// from the pojo.

export function isKey(key) {
  return typeof key === 'string' || typeof key === 'symbol'
}

export class PartialReflect {

  static *keys(type, { isStatic } = { }) { 
    if (PartialTypeReflect.isPartialType(type)) {
      if (isStatic) return
      return yield* PartialPrototype.keys(type)
    }
    
    if (PartialTypeReflect.isKnown(type)) return
    yield* Es6UserReflect.keys(type, { isStatic })
  }
  static *ownKeys(type, { isStatic } = { }) {
    // TODO: Remove assert?
    assert(PartialTypeReflect.isPartialType(type))
    for (const current of PartialReflect.keys(type, { isStatic })) {
      switch (typeof current) {
        case 'function': break
        case 'string':
        case 'symbol': 
          if (!PartialReflect.isOwnKey(type, current, { isStatic })) 
            continue
          yield current
          break
        default: assert(false, `Unexpected type: ${typeof current}`)
      }
    }    
  }
  static isOwnKey(type, key, { isStatic } = { }) {
    // TODO: Remove assert?
    assert(PartialTypeReflect.isPartialType(type))
    if (isStatic) return false
    const finalHost = PartialReflect.getImplementingHost(type, key, { isStatic })
    return finalHost === type
  }

  static getOwnDescriptor(type, key, { isStatic } = { }) {
    if (PartialTypeReflect.isPartialType(type)) {
      if (isStatic) return
      return PartialLoader.getOwnDescriptor(type, key) 
    }
    
    if (PartialTypeReflect.isKnownKey(type, key, { isStatic })) return
    return Es6UserReflect.getOwnDescriptor(type, key, { isStatic })
  }
  static *ownDescriptors(type, { isStatic } = { }) {
    if (PartialTypeReflect.isPartialType(type)) {
      if (isStatic) return
      return yield *PartialLoader.ownDescriptors(type)
    }

    if (PartialTypeReflect.isKnown(type)) return
    yield* Es6UserReflect.ownDescriptors(type, { isStatic })
  }
  
  static *getDescriptor(type, key, { isStatic } = { }) {
    if (PartialTypeReflect.isPartialType(type)) {
      if (isStatic) return
      return yield *PartialPrototype.getDescriptor(type, key)
    }

    if (PartialTypeReflect.isKnownKey(type, key, { isStatic })) return
    yield* Es6UserReflect.getDescriptor(type, key, { isStatic })

  }
  static *descriptors(type, { isStatic } = { }) {
    if (PartialTypeReflect.isPartialType(type)) {
      if (isStatic) return
      return yield* PartialPrototype.descriptors(type)
    }

    if (PartialTypeReflect.isKnown(type)) return
    yield* Es6UserReflect.descriptors(type, { isStatic })
  }

  static *ownPartialTypes(type) {
    if (PartialTypeReflect.isPartialType(type)) 
      return yield* PartialLoader.ownPartialTypes(type)

    yield* PartialAssociate.ownPartialTypes(type)
  }
  static *partialTypes(type) {
    if (PartialTypeReflect.isPartialType(type)) {
      // filter out self; the prototypical type correctly reports it was
      // extened by the partial type however the prototypical type, being
      // a stand in for the partial type, should not report that it was 
      // extended by the partial type.
      for (const current of PartialPrototype.partialTypes(type)) {
        if (current == type) continue
        yield current
      }
    }

    yield* PartialAssociate.partialTypes(type)
  }

  static *hosts(type, key) {
    if (PartialTypeReflect.isPartialType(type))
      return yield* PartialPrototype.hosts(type, key)

    // yield types in the hiearchy that resolve the key to a member.
    const hosts = new Set(PartialAssociate.hosts(type, key))
    for (const host of Es6UserReflect.getHosts(type, key)) hosts.add(host)
    yield* hosts
  }

  static getImplementingHost(type, key) {
    if (PartialTypeReflect.isPartialType(type))
      return PartialPrototype.getImplementingHost(type, key)

    if (key in type.prototype === false) return null

    return PartialAssociate.getImplementingHost(type, key) || type
  }

  static load(pojoOrType) {
    return PartialLoader.load(pojoOrType)
  }
}
