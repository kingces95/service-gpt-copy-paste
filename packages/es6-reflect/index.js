import assert from 'assert'
import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { es6Typeof } from '@kingjs/es6-typeof'

const KnownInstanceMembers = new Set([ 'constructor' ])
const KnownStaticMembers = new Set([ 'length', 'name', 'prototype' ])

// Es6Reflect, like Reflect but operates on Type and is static aware.

export class Es6Reflect {
  static baseType$(type, { isStatic } = { }) {
    const result = Es6Reflect.baseType(type)
    if (isStatic && result == Object)
      return null
    return result
  }
  static baseType(type) {
    if (type == null) type = Object

    let prototype = type.prototype

    prototype = Object.getPrototypeOf(prototype)
    if (prototype == Function.prototype) 
      prototype = Object.prototype

    return prototype?.constructor ?? null
  }

  static isAbstract(type) {
    let current = type
    while (current) {
      if (current == Object) return false
      current = Es6Reflect.baseType(current)
    }
    return true
  }

  static typeof(fn, key, descriptor, { isStatic } = { }) {
    const descriptorType = Es6Descriptor.typeof(descriptor)
    if (descriptorType != 'field')
      return descriptorType

    const value = descriptor.value
    const es6Type = es6Typeof(value)
    if (key === 'constructor' 
      && !isStatic 
      && value === fn) {

      assert(es6Type == 'class')
      return 'constructor'
    }

    return 'field'
  }

  // predicates
  static isKnown(type) {
    return type == Object || type == Function
  }
  static isKnownKey(type, name, { isStatic } = { }) {
    if (Es6Reflect.isKnown(type)) return true
    return isStatic
      ? KnownStaticMembers.has(name)
      : KnownInstanceMembers.has(name)
  }
  static isExtensionOf(cls, targetCls) {
    let base = cls
    while (base = Es6Reflect.baseType(base))
      if (base == targetCls) return true
    return false
  }

  static *hierarchy(type) {
    let current = type
    while (current) {
      yield current
      current = Es6Reflect.baseType(current)
    }
  }

  static hasOwnKey(type, name, { isStatic, excludeKnown } = { }) {
    if (excludeKnown && Es6Reflect.isKnownKey(type, name, { isStatic }))
      return false

    const object = isStatic
      ? type
      : type.prototype

    return Object.prototype.hasOwnProperty.call(object, name)
  }

  static *ownKeys(type, { isStatic, excludeKnown } = { }) {
    const keys = isStatic
      ? Reflect.ownKeys(type)
      : Reflect.ownKeys(type.prototype)

    for (const name of keys) {
      if (excludeKnown && Es6Reflect.isKnownKey(type, name, { isStatic }))
        continue
      yield name
    }
  }

  static *keys(type, { isStatic, excludeKnown } = { }) {
    const visited = new Set()

    let current = type
    while (current) {
      yield current
      for (const key of Es6Reflect.ownKeys(current, { isStatic, excludeKnown })) {
        if (visited.has(key)) continue
        visited.add(key)
        yield key
      }
      current = Es6Reflect.baseType$(current, { isStatic })
    }
  }

  static getHost(type, name, { isStatic, excludeKnown } = { }) {
    let current = type
    while (current) {
      if (Es6Reflect.hasOwnKey(current, name, { isStatic, excludeKnown }))
        return current

      current = Es6Reflect.baseType$(current, { isStatic })
    }
    return null
  }

  static getOwnDescriptor(type, name, { isStatic, excludeKnown } = { }) {
    if (!Es6Reflect.hasOwnKey(type, name, { isStatic, excludeKnown }))
      return null

    const object = isStatic
      ? type
      : type.prototype

    return Object.getOwnPropertyDescriptor(object, name)
  }
  static *ownDescriptors(type, { isStatic, excludeKnown } = { }) {
    const ownKeys = Es6Reflect.ownKeys(type, { isStatic, excludeKnown })
    for (const key of ownKeys) {
      const descriptor = Es6Reflect.getOwnDescriptor(
        type, key, { isStatic, excludeKnown })
      yield key
      yield descriptor
    }
  }  

  static *getDescriptor(type, name, { isStatic, excludeKnown } = { }) {
    let current = type
    while (current) {
      const descriptor = Es6Reflect.getOwnDescriptor(
        current, name, { isStatic, excludeKnown })
      if (descriptor) {
        yield current
        return yield descriptor
      }

      current = Es6Reflect.baseType$(current, { isStatic })
    }
  }
  static *descriptors(type, { isStatic, excludeKnown } = { }) {
    let owner
    for (const current of Es6Reflect.keys(type, { isStatic, excludeKnown })) {
      switch (typeof current) {
        case 'function': owner = current; yield owner; break
        case 'string':
        case 'symbol': {
          const descriptor = Es6Reflect.getOwnDescriptor(
            owner, current, { isStatic, excludeKnown })
          yield current
          yield descriptor
          break
        }
        default: assert(false, `Unexpected type: ${typeof current}`)
      }
    }
  }

  static getMetadata(type) {
    return Metadata.get(type)
  }
}


export class Es6GetterMd {
  static Type = 'getter'
  static DefaultConfigurable = true
  static DefaultEnumerable = false
}
export class Es6SetterMd { 
  static Type = 'setter'
  static DefaultConfigurable = true
  static DefaultEnumerable = false
}
export class Es6PropertyMd { 
  static Type = 'property'
  static DefaultConfigurable = true
  static DefaultEnumerable = false
}
export class Es6FieldMd { 
  static Type = 'field'
  static DefaultConfigurable = true
  static DefaultWritable = true
  static DefaultEnumerable = true
}
export class Es6MethodMd { 
  static Type = 'method'
  static DefaultConfigurable = true
  static DefaultWritable = true
  static DefaultEnumerable = false
}
export class Es6ConstructorMd { 
  static Type = 'constructor'
  static DefaultConfigurable = true
  static DefaultWritable = true
  static DefaultEnumerable = false
}
export class Es6PrototypeMd { 
  static Type = 'prototype'
  static DefaultConfigurable = false
  static DefaultWritable = false
  static DefaultEnumerable = false
}

const Metadata = new Map([
  [Es6FieldMd.Type, Es6FieldMd],
  [Es6MethodMd.Type, Es6MethodMd],
  [Es6GetterMd.Type, Es6GetterMd],
  [Es6SetterMd.Type, Es6SetterMd],
  [Es6PropertyMd.Type, Es6PropertyMd],
  [Es6ConstructorMd.Type, Es6ConstructorMd],
  [Es6PrototypeMd.Type, Es6PrototypeMd],
])