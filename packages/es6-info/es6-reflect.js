const KnownInstanceMembers = new Set([ 'constructor'])
const KnownStaticMembers = new Set([ 'length', 'name', 'prototype'])

export class Es6Reflect {
  
  static *#keys(prototype, root, ownKeysFn) {
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

  static *names(prototype, root = Object) {
    yield *Es6Reflect.#keys(prototype, root, Object.getOwnPropertyNames)
  }

  static *symbols(prototype, root = Object) {
    yield *Es6Reflect.#keys(prototype, root, Object.getOwnPropertySymbols)
  }

  static *keys(prototype, root = Object) {
    yield* Es6Reflect.names(prototype, root)
    yield* Es6Reflect.symbols(prototype, root)
  }

  static *memberKeys(prototype, root = Object) {
    yield *Es6Reflect.#keys(prototype, root, Es6Reflect.ownMemberKeys)
  }

  static isKnownInstanceMember(name) {
    return KnownInstanceMembers.has(name)
  }

  static isKnownStaticMember(name) {
    return KnownStaticMembers.has(name)
  }

  static *ownMemberKeys(prototype) {
    for (const name of Reflect.ownKeys(prototype)) {
      if (Es6Reflect.isKnownInstanceMember(name)) continue
      yield name
    }
  }

  static *ownStaticMemberKeys(prototype) {
    for (const name of Reflect.ownKeys(prototype)) {
      if (Es6Reflect.isKnownStaticMember(name)) continue
      yield name
    }
  }

  static isExtensionOf(childClass, parentClass) {
    let prototype = childClass
    while (prototype) {
      if (prototype === parentClass) return true
      prototype = Object.getPrototypeOf(prototype)
    }
    return false
  }

  static *prototypes(target) {
    let prototype = Object.getPrototypeOf(target)
    while (prototype) {
      yield prototype
      prototype = Object.getPrototypeOf(prototype)
    }
  }
  
  static *prototypeHierarchy(target) {
    yield target
    yield* Es6Reflect.prototypes(target)
  }
}
