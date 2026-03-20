import { isAbstract } from '@kingjs/abstract'
import { Es6Reflect$ } from '@kingjs/es6-reflector'

const Reflector$ = new Es6Reflect$()

// Es6Reflect, like Reflect but operates on Type and is static aware.

export class Es6Reflect {

  static baseType(type) {
    if (type == null) return null
    return Reflector$.getBaseType(type)
  }

  static *baseTypes(type) {
    yield* Reflector$.baseTypes(type)
  }
  static isAbstract(type) {
    return Reflector$.isAbstract(type)
  }
  static typeof(fn, key, descriptor, { isStatic } = { }) {
    return Reflector$.typeof(fn, key, descriptor, { isStatic })
  }
  static isExtensionOf(cls, targetCls) {
    return Reflector$.isExtensionOf(cls, targetCls)
  }

  static *hierarchy(type, { isStatic } = { }) {
    yield* Reflector$.hierarchy(type, { isStatic })
  }

  static isKnown(type, { isStatic, excludeKnown } = { }) {
    return Reflector$.isKnown(
      type, { isStatic, excludeKnown: true })
  }
  static isKnownKey(type, name, { isStatic, excludeKnown } = { }) {
    return Reflector$.isKnownKey(
      type, name, { isStatic, excludeKnown: true })
  }
  static hasOwnKey(type, name, { isStatic, excludeKnown } = { }) {
    return Reflector$.hasOwnKey(type, name, { isStatic, excludeKnown })
  }
  static *ownKeys(type, { isStatic, excludeKnown } = { }) {
    yield* Reflector$.ownKeys(type, { isStatic, excludeKnown })
  }
  static *keys(type, { isStatic, excludeKnown } = { }) {
    yield* Reflector$.keys(type, { isStatic, excludeKnown })
  }

  static isHostOf(type, name, { isStatic, excludeKnown } = { }) {
    return Reflector$.isHostOf(type, name, { isStatic, excludeKnown })
  }
  static *getHosts(type, name, { isStatic, excludeKnown } = { }) {
    yield* Reflector$.getHosts(type, name, { isStatic, excludeKnown })
  }

  static getOwnDescriptor(type, name, { isStatic, excludeKnown } = { }) {
    return Reflector$.getOwnDescriptor(type, name, { isStatic, excludeKnown })
  }
  static *ownDescriptors(type, { isStatic, excludeKnown } = { }) {
    yield* Reflector$.ownDescriptors(type, { isStatic, excludeKnown })
  }  

  static *getDescriptor(type, name, { isStatic, excludeKnown } = { }) {
    yield* Reflector$.getDescriptor(type, name, { isStatic, excludeKnown })
  }
  static *descriptors(type, { isStatic, excludeKnown } = { }) {
    yield* Reflector$.descriptors(type, { isStatic, excludeKnown })
  }

  static getMetadata(type) {
    return Metadata.get(type)
  }

  static defineProperty(type, key, descriptor) {
    const prototype = type.prototype

    if (key in prototype && isAbstract(descriptor)) return false

    Object.defineProperty(prototype, key, descriptor)
    return true
  }

  // static defineProperties(type, descriptors) {
  //   const keys = []
  //   for (const key of Reflect.ownKeys(descriptors)) {
  //     const defined = Es6Reflect.property(type, key, descriptors[key])
  //     keys.push([key, defined])
  //   }
  //   return keys
  // }
  
  static defineType(name = null, base = Object, pojo = { }) {
    const [type] = [class extends base { }]
    
    Object.defineProperties(type, {
      name: {
        value: name,
        configurable: true,
        enumerable: false,
        writable: false,
      }
    })

    const prototype = type.prototype
    for (const key of Reflect.ownKeys(pojo)) {
      if (key === 'constructor') continue
      const descriptor = Object.getOwnPropertyDescriptor(pojo, key)
      Object.defineProperty(prototype, key, descriptor)
    }

    const descriptors = Object.getOwnPropertyDescriptors(type.prototype)
    return type
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