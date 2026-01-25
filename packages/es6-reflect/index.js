import assert from 'assert'
import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { es6Typeof } from '@kingjs/es6-typeof'

const KnownInstanceMembers = new Set([ 'constructor' ])
const KnownStaticMembers = new Set([ 'length', 'name', 'prototype' ])

// Es6Reflect, like Reflect but operates on Type and is static aware.

export class Es6Reflect {
  static *#prototypeChain(type, { isStatic } = { }) {
    let object = isStatic
      ? type
      : type.prototype

    while (object) {
      yield object
      object = Object.getPrototypeOf(object)
    }
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
    const hierarchy = Es6Reflect.hierarchy(cls, { isStatic: true })
    for (const current of hierarchy) {
      if (current == cls) continue
      if (current == targetCls) return true
    }
    return false
  }

  static *hierarchy(type, { isStatic } = { }) {
    if (isStatic) {
      for (const object of Es6Reflect.#prototypeChain(type, { isStatic })) {

        // Suppress Function.prototype; the fact that an Es6 
        // class is a function is not relevant to static hierarchy 
        // declared in source code; Effect is to exclude methods 
        // like call, bind, apply, etc.
        if (object == Function.prototype) break
        
        yield object
      }
    }
    else {
      for (const object of Es6Reflect.#prototypeChain(type, { isStatic }))
        yield object.constructor
    }
  }

  static hasOwnKey(type, name, { isStatic, excludeKnown } = { }) {
    if (excludeKnown && Es6Reflect.isKnownKey(type, name, { isStatic }))
      return false

    const object = isStatic
      ? type
      : type.prototype

    return object.hasOwnProperty(name)
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
    for (const owner of Es6Reflect.hierarchy(type, { isStatic })) {
      yield owner
      for (const key of Es6Reflect.ownKeys(owner, { isStatic, excludeKnown })) {
        if (visited.has(key)) continue
        visited.add(key)
        yield key
      }
    }
  }

  static getHost(type, name, { isStatic, excludeKnown } = { }) {
    for (const owner of Es6Reflect.hierarchy(type, { isStatic })) {
      if (!Es6Reflect.hasOwnKey(owner, name, { isStatic, excludeKnown })) 
        continue
      return owner
    }
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
    for (const owner of Es6Reflect.hierarchy(type, { isStatic })) {
      const descriptor = Es6Reflect.getOwnDescriptor(
        owner, name, { isStatic, excludeKnown })
      if (!descriptor) continue
      yield owner
      return yield descriptor
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