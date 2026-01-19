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
    for (const current of hierarchy)
      if (current == targetCls) return true
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

  static *keys(type, { isStatic, excludeKnown, includeOwner } = { }) {
    const visited = new Set()
    for (const owner of Es6Reflect.hierarchy(type, { isStatic })) {
      for (const key of Es6Reflect.ownKeys(owner, { isStatic, excludeKnown })) {
        if (visited.has(key)) continue
        visited.add(key)
        
        yield includeOwner 
          ? [ key, owner ]
          : key
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
      yield [key, descriptor]
    }
  }

  static getDescriptor(type, name, { isStatic, excludeKnown, includeOwner } = { }) {
    for (const owner of Es6Reflect.hierarchy(type, { isStatic })) {
      const descriptor = Es6Reflect.getOwnDescriptor(
        owner, name, { isStatic, excludeKnown })
      if (!descriptor) continue
      return includeOwner
        ? [descriptor, owner]
        : descriptor
    }
    return null
  }
  
  static *descriptors(type, { isStatic, excludeKnown, includeContext } = { }) {
    for (const [name, owner] of Es6Reflect.keys(
      type, { isStatic, includeOwner: true })) {
      const descriptor = Es6Reflect.getOwnDescriptor(
        owner, name, { isStatic, excludeKnown })
      yield includeContext
        ? [descriptor, name, owner]
        : descriptor
    }
  }
}
