import { PartialAssociate } from '@kingjs/partial-associate'
import { PartialLoader } from '@kingjs/partial-loader'
import { PartialReflector } from '@kingjs/partial-reflector'
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

export const PartialReflect$ = new PartialReflector()

export class PartialReflect {

  static getPrototype(type, { isStatic } = { }) {
    return PartialReflect$.getPrototype(type, { isStatic })
  }
  static *keys(type, { isStatic, includeOverridden } = { }) { 
    return yield* PartialReflect$.keys(type, { 
      isStatic, includeOverridden })
  }
  static *ownKeys(type, { isStatic } = { }) {
    return yield* PartialReflect$.ownKeys(type, { isStatic })
  }
  static isOwnKey(type, key, { isStatic } = { }) {
    return PartialReflect$.isOwnKey(type, key, { isStatic })
  }

  static getOwnDescriptor(type, key, { isStatic } = { }) {
    return PartialReflect$.getOwnDescriptor(type, key, { isStatic })
  }
  static *ownDescriptors(type, { isStatic } = { }) {
    return yield* PartialReflect$.ownDescriptors(type, { isStatic })
  }
  
  static *getDescriptor(type, key, { isStatic } = { }) {
    return yield* PartialReflect$.getDescriptor(type, key, { isStatic })
  }
  static *descriptors(type, { isStatic, includeOverridden } = { }) {
    return yield* PartialReflect$.descriptors(type, { 
      isStatic, includeOverridden })
  }

  static *partialTypes(type) {
    if (PartialTypeReflect.isPartialType(type))
      return yield* PartialReflect$.baseTypes(type)

    yield* PartialAssociate.partialTypes(type)
  }

  static *hosts(type, key) {
    if (PartialTypeReflect.isPartialType(type))
      return yield* PartialReflect$.hosts(type, key)

    // yield types in the hiearchy that resolve the key to a member.
    const hosts = new Set(PartialAssociate.hosts(type, key))
    for (const host of Es6UserReflect.hosts(type, key)) 
      hosts.add(host)
    yield* hosts
  }

  static load(pojoOrType) {
    return PartialLoader.load(pojoOrType)
  }
}
