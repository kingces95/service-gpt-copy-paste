import { assert } from '@kingjs/assert'
import { PartialPojo } from '@kingjs/partial-pojo'
import { Define } from '@kingjs/define'
import { PartialAssociate } from '@kingjs/partial-associate'
import { PartialLoader } from '@kingjs/partial-loader'
import { PartialPrototype } from '@kingjs/partial-prototype'
import { UserReflect } from '@kingjs/user-reflect'
import { PartialObjectReflect } from '@kingjs/partial-object'

// Dispatches reflection operations to either PartialLoader/PartialPrototype
// or UserReflect based on whether the type is a PartialObject.
// Filters out known types. For known types, no reflection is performed.
// Filters out knnow keys. For known keys, no reflection is performed.

export class PartialReflect {

  static *keys(type, { isStatic } = { }) { 
    if (PartialObjectReflect.isPartialObject(type)) {
      if (isStatic) return
      return yield* PartialPrototype.keys(type)
    }
    
    if (PartialObjectReflect.isKnown(type)) return
    yield* UserReflect.keys(type, { isStatic })
  }
  static *ownKeys(type, { isStatic } = { }) {
    assert(PartialObjectReflect.isPartialObject(type))
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
  static isKey(key) {
    return typeof key === 'string' || typeof key === 'symbol'
  }

  static getOwnDescriptor(type, key, { isStatic } = { }) {
    if (PartialObjectReflect.isPartialObject(type)) {
      if (isStatic) return
      return PartialLoader.getOwnDescriptor(type, key) 
    }
    
    if (PartialObjectReflect.isKnownKey(type, key, { isStatic })) return
    return UserReflect.getOwnDescriptor(type, key, { isStatic })
  }
  static *ownDescriptors(type, { isStatic } = { }) {
    if (PartialObjectReflect.isPartialObject(type)) {
      if (isStatic) return
      return yield *PartialLoader.ownDescriptors(type)
    }

    if (PartialObjectReflect.isKnown(type)) return
    yield* UserReflect.ownDescriptors(type, { isStatic })
  }
  
  static *getDescriptor(type, key, { isStatic } = { }) {
    if (PartialObjectReflect.isPartialObject(type)) {
      if (isStatic) return
      return yield *PartialPrototype.getDescriptor(type, key)
    }

    if (PartialObjectReflect.isKnownKey(type, key, { isStatic })) return
    yield* UserReflect.getDescriptor(type, key, { isStatic })

  }
  static *descriptors(type, { isStatic } = { }) {
    if (PartialObjectReflect.isPartialObject(type)) {
      if (isStatic) return
      return yield* PartialPrototype.descriptors(type)
    }

    if (PartialObjectReflect.isKnown(type)) return
    yield* UserReflect.descriptors(type, { isStatic })
  }

  static *ownPartialObjects(type) {
    if (PartialObjectReflect.isPartialObject(type))
      return yield* PartialLoader.ownPartialObjects(type)

    yield* PartialAssociate.ownPartialObjects(type)
  }
  static *partialObjects(type) {
    if (PartialObjectReflect.isPartialObject(type))
      return yield* PartialPrototype.partialObjects(type)

    yield* PartialAssociate.partialObjects(type)
  }

  static *hosts(type, key, { isStatic } = { }) {
    if (PartialObjectReflect.isPartialObject(type)) {
      if (isStatic) return
      return yield* PartialPrototype.hosts(type, key)
    }

    yield* PartialAssociate.hosts(type, key, { isStatic })
  }
  static getHost(type, key, { isStatic } = { }) {
    if (PartialObjectReflect.isPartialObject(type)) {
      if (isStatic) return
      return PartialPrototype.getHost(type, key)
    }

    return PartialAssociate.getHost(type, key, { isStatic })
  }

  static merge(type, partialType) {
    return PartialLoader.merge(type, partialType)
  }

  static defineType(pojoOrType) {
    const type = Define.type(pojoOrType, PartialPojo)
    assert(PartialObjectReflect.isPartialObject(type))
    return type
  }
}
