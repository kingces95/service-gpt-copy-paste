const KnownInstanceMembers = new Set([ 'constructor' ])
const KnownStaticMembers = new Set([ 'length', 'name', 'prototype' ])

// Es6Reflect, like Reflect but operates on Type and is static aware.

export class Es6Reflect {
  static *#prototypeChain(object) {
    while (object) {
      yield object
      object = Object.getPrototypeOf(object)
    }
  }

  static *hierarchy$(type, isStatic) {
    if (isStatic) {
      for (const object of Es6Reflect.#prototypeChain(type)) {

        // Suppress Function.prototype; the fact that an Es6 
        // class is a function is not relevant to static hierarchy 
        // declared in source code; Effect is to exclude methods 
        // like call, bind, apply, etc.
        if (object == Function.prototype) break
        
        yield object
      }
    }
    else {
      for (const object of Es6Reflect.#prototypeChain(type.prototype))
        yield object.constructor
    }
  }

  static isKnownKey$(type, name, isStatic) {
    if (Es6Reflect.isKnown(type)) return true
    return isStatic
      ? KnownStaticMembers.has(name)
      : KnownInstanceMembers.has(name)
  }

  static *ownKeys$(type, isStatic) {
    const keys = isStatic
      ? Reflect.ownKeys(type)
      : Reflect.ownKeys(type.prototype)

    yield* keys
  }

  static *members$(type, isStatic) {
    const visited = new Set()
    for (const current of Es6Reflect.hierarchy$(type, isStatic)) {
      for (const name of Es6Reflect.ownKeys$(current, isStatic)) {
        if (visited.has(name)) continue
        visited.add(name)
        yield [name, current]
      }
    }
  }

  static *ownDescriptors$(type, isStatic) {
    const ownKeys = Es6Reflect.ownKeys$(type, isStatic)
    for (const key of ownKeys) {
      const descriptor = Es6Reflect.getOwnDescriptor$(type, key, isStatic)
      yield [key, descriptor]
    }
  }

  static getOwnDescriptor$(type, name, isStatic) {
    const object = isStatic
      ? type
      : type.prototype

    return Object.getOwnPropertyDescriptor(object, name)
  }

  static *descriptors$(type, isStatic) {
    for (const [name, owner] of Es6Reflect.members$(type, isStatic)) {
      const descriptor = Es6Reflect.getOwnDescriptor$(owner, name, isStatic)
      yield [name, owner, descriptor]
    }
  }

  static getDescriptor$(type, name, isStatic) {
    for (const current of Es6Reflect.hierarchy$(type, isStatic)) {
      const descriptor = Es6Reflect.getOwnDescriptor$(current, name, isStatic)
      if (!descriptor) continue
      return [descriptor, current]
    }
    return null
  }

  static *#keys(type, isStatic) {
    for (const [name] of Es6Reflect.members$(type, isStatic))
      yield name
  }

  // type hierarchies
  static *staticHierarchy(type) {
    yield* Es6Reflect.hierarchy$(type, true)
  }
  static *instanceHierarchy(type) {
    yield* Es6Reflect.hierarchy$(type, false)
  }

  // predicates
  static isKnown(type) {
    return type == Object || type == Function
  }
  static isKnownStaticKey(type, name) {
    return Es6Reflect.isKnownKey$(type, name, true)
  }
  static isKnownInstanceKey(type, name) {
    return Es6Reflect.isKnownKey$(type, name, false)
  }
  static isExtensionOf(cls, targetCls) {
    const hierarchy = Es6Reflect.staticHierarchy(cls)
    for (const current of hierarchy)
      if (current == targetCls) return true
    return false
  }

  // name resolution
  static getOwnStaticDescriptor(type, name) {
    return Es6Reflect.getOwnDescriptor$(type, name, true)
  }
  static getOwnInstanceDescriptor(type, name) {
    return Es6Reflect.getOwnDescriptor$(type, name, false)
  }
  static getStaticDescriptor(type, name) {
    return Es6Reflect.getDescriptor$(type, name, true)
  }
  static getInstanceDescriptor(type, name) {
    return Es6Reflect.getDescriptor$(type, name, false)
  }
  static getInstanceHost(type, name) {
    const [ _, host ] = Es6Reflect.getDescriptor$(type, name, false) || []
    return host || null
  }
  static getStaticHost(type, name) {
    const [ _, host ] = Es6Reflect.getDescriptor$(type, name, true) || []
    return host || null
  }

  // key enumerations
  static* ownInstanceKeys(type) {
    yield* Es6Reflect.ownKeys$(type, false)
  }
  static* ownStaticKeys(type) {
    yield* Es6Reflect.ownKeys$(type, true)
  }
  static* instanceKeys(type) {
    yield* Es6Reflect.#keys(type, false)
  }
  // static* staticKeys(type) {
  //   yield* Es6Reflect.#keys(type, true)
  // }
  static* instanceMembers(type) {
    yield* Es6Reflect.members$(type, false)
  }
  static* staticMembers(type) {
    yield* Es6Reflect.members$(type, true)
  }
  
  static *#keys$(prototype, root, ownKeysFn) {
    const keys = new Set()
    while (prototype != root?.prototype) {
      for (const key of ownKeysFn(prototype)) {
        if (keys.has(key)) continue
        yield key
        keys.add(key)
      }
      prototype = Object.getPrototypeOf(prototype)
    }
  }

  static *keys$(prototype, root = Object) {
    // assert(root == Object)
    yield *Es6Reflect.#keys$(prototype, root, Object.getOwnPropertyNames)
    yield *Es6Reflect.#keys$(prototype, root, Object.getOwnPropertySymbols)
  }
}
