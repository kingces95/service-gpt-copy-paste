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

  static *ownKeys(type, { isStatic } = { }) {
    const keys = isStatic
      ? Reflect.ownKeys(type)
      : Reflect.ownKeys(type.prototype)

    yield* keys
  }

  static getHost(type, name, { isStatic } = { }) {
    for (const current of Es6Reflect.#prototypeChain(type, { isStatic })) {
      if (current.hasOwnProperty(name))
        return current
    }
  }

  static *members(type, { isStatic } = { }) {
    const visited = new Set()
    for (const current of Es6Reflect.hierarchy(type, { isStatic })) {
      for (const name of Es6Reflect.ownKeys(current, { isStatic })) {
        if (visited.has(name)) continue
        visited.add(name)
        yield [name, current]
      }
    }
  }

  static *ownDescriptors(type, { isStatic } = { }) {
    const ownKeys = Es6Reflect.ownKeys(type, { isStatic })
    for (const key of ownKeys) {
      const descriptor = Es6Reflect.getOwnDescriptor(type, key, { isStatic })
      yield [key, descriptor]
    }
  }

  static getOwnDescriptor(type, name, { isStatic } = { }) {
    const object = isStatic
      ? type
      : type.prototype

    return Object.getOwnPropertyDescriptor(object, name)
  }

  static *descriptors(type, { isStatic } = { }) {
    for (const [name, owner] of Es6Reflect.members(type, { isStatic })) {
      const descriptor = Es6Reflect.getOwnDescriptor(owner, name, { isStatic })
      yield [name, owner, descriptor]
    }
  }

  static getDescriptor(type, name, { isStatic } = { }) {
    for (const current of Es6Reflect.hierarchy(type, { isStatic })) {
      const descriptor = Es6Reflect.getOwnDescriptor(current, name, { isStatic })
      if (!descriptor) continue
      return [descriptor, current]
    }
    return null
  }
}
