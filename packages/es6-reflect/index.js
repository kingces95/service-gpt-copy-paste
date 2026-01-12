import assert from 'assert'

const KnownInstanceMembers = new Set([ 'constructor' ])
const KnownStaticMembers = new Set([ 'length', 'name', 'prototype' ])

// New version that is static and known aware. Takes type instead of prototype.
export class Es6Reflect {
  static *#prototypeChain(object) {
    while (object) {
      yield object
      object = Object.getPrototypeOf(object)
    }
  }

  static *#hierarchy(type, isStatic) {
    yield* isStatic
      ? Es6Reflect.staticHierarchy(type)
      : Es6Reflect.instanceHierarchy(type)
  }

  static isKnownKey$(type, name, isStatic) {
    if (Es6Reflect.isKnown(type)) return true
    return isStatic
      ? KnownStaticMembers.has(name)
      : KnownInstanceMembers.has(name)
  }

  static *#ownKeys(type, isStatic) {
    const keys = isStatic
      ? Reflect.ownKeys(type)
      : Reflect.ownKeys(type.prototype)

    for (const name of keys) {
      if (Es6Reflect.isKnownKey$(type, name, isStatic)) continue
      yield name
    }
  }

  static *#keys(type, isStatic) {
    const visited = new Set()
    for (const current of Es6Reflect.#hierarchy(type, isStatic)) {
      for (const name of Es6Reflect.#ownKeys(current, isStatic)) {
        if (visited.has(name)) continue
        visited.add(name)
        yield name
      }
    }
  }

  // type hierarchies
  static *staticHierarchy(type) {
    for (const object of Es6Reflect.#prototypeChain(type)) {

      // Suppress Function.prototype; the fact that an Es6 
      // class is a function is not relevant to static hierarchy 
      // declared in source code; Naturally will exclude methods 
      // like call, bind, apply, etc.
      if (object == Function || object == Function.prototype) break
      
      yield object
    }
  }
  static *instanceHierarchy(type) {
    for (const object of Es6Reflect.#prototypeChain(type.prototype))
      yield object.constructor
  }

  // predicates
  static isKnown(type) {
    return type == Object || type == Function
  }
  static isExtensionOf(cls, targetCls) {
    const hierarchy = Es6Reflect.staticHierarchy(cls)
    for (const current of hierarchy)
      if (current == targetCls) return true
    return false
  }

  // key enumerations
  static* ownInstanceKeys(type) {
    yield* Es6Reflect.#ownKeys(type, false)
  }
  static* ownStaticKeys(type) {
    yield* Es6Reflect.#ownKeys(type, true)
  }
  static* instanceKeys(type) {
    yield* Es6Reflect.#keys(type, false)
  }
  static* staticKeys(type) {
    yield* Es6Reflect.#keys(type, true)
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
