import { assert } from '@kingjs/assert'
import { PartialAssociate } from '@kingjs/partial-associate'
import { PartialLoader } from '@kingjs/partial-loader'
import { PartialPrototype } from '@kingjs/partial-prototype'
import { UserReflect } from '@kingjs/user-reflect'
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
    yield* UserReflect.keys(type, { isStatic })
  }
  static *ownKeys(type, { isStatic } = { }) {
    assert(PartialTypeReflect.isPartialType(type))
    for (const current of PartialReflect.keys(type, { isStatic })) {
      switch (typeof current) {
        case 'function': break
        case 'string':
        case 'symbol': 
          const host = PartialReflect.getHost(type, current, { isStatic })
          if (host != type) continue
          yield current
          break
        default: assert(false, `Unexpected type: ${typeof current}`)
      }
    }    
  }

  static getOwnDescriptor(type, key, { isStatic } = { }) {
    if (PartialTypeReflect.isPartialType(type)) {
      if (isStatic) return
      return PartialLoader.getOwnDescriptor(type, key) 
    }
    
    if (PartialTypeReflect.isKnownKey(type, key, { isStatic })) return
    return UserReflect.getOwnDescriptor(type, key, { isStatic })
  }
  static *ownDescriptors(type, { isStatic } = { }) {
    if (PartialTypeReflect.isPartialType(type)) {
      if (isStatic) return
      return yield *PartialLoader.ownDescriptors(type)
    }

    if (PartialTypeReflect.isKnown(type)) return
    yield* UserReflect.ownDescriptors(type, { isStatic })
  }
  
  static *getDescriptor(type, key, { isStatic } = { }) {
    if (PartialTypeReflect.isPartialType(type)) {
      if (isStatic) return
      return yield *PartialPrototype.getDescriptor(type, key)
    }

    if (PartialTypeReflect.isKnownKey(type, key, { isStatic })) return
    yield* UserReflect.getDescriptor(type, key, { isStatic })

  }
  static *descriptors(type, { isStatic } = { }) {
    if (PartialTypeReflect.isPartialType(type)) {
      if (isStatic) return
      return yield* PartialPrototype.descriptors(type)
    }

    if (PartialTypeReflect.isKnown(type)) return
    yield* UserReflect.descriptors(type, { isStatic })
  }

  static *ownPartialExtensions(type) {
    if (PartialTypeReflect.isPartialType(type))
      return yield* PartialLoader.ownPartialExtensions(type)

    yield* PartialAssociate.ownPartialExtensions(type)
  }
  static *partialExtensions(type) {
    if (PartialTypeReflect.isPartialType(type))
      return yield* PartialPrototype.partialExtensions(type)

    yield* PartialAssociate.partialExtensions(type)
  }

  static *hosts(type, key, { isStatic } = { }) {
    if (PartialTypeReflect.isPartialType(type)) {
      if (isStatic) return
      return yield* PartialPrototype.hosts(type, key)
    }

    yield* PartialAssociate.hosts(type, key, { isStatic })
  }
  static getHost(type, key, { isStatic } = { }) {
    if (PartialTypeReflect.isPartialType(type)) {
      if (isStatic) return
      return PartialPrototype.getHost(type, key)
    }

    return PartialAssociate.getHost(type, key, { isStatic })
  }

  static load(pojoOrType) {
    return PartialLoader.load(pojoOrType)
  }
}
