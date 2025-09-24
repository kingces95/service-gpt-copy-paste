const KnownInstanceMembers = new Set([ 'constructor'])
const KnownStaticMembers = new Set([ 'length', 'name', 'prototype'])

export class Reflection {
  static isExtensionOf(childClass, parentClass) {
    let prototype = childClass
    while (prototype) {
      if (prototype === parentClass) return true
      prototype = Object.getPrototypeOf(prototype)
    }
    return false;
  }

  static *#keys(prototype, root, ownKeysFn) {
    const keys = new Set()
    while (prototype != root.prototype) {
      for (const key of ownKeysFn(prototype)) {
        if (keys.has(key)) continue
        yield key
        keys.add(key)
      }
      prototype = Object.getPrototypeOf(prototype)
    }
  }

  static *names(prototype, root = Object) {
    yield *Reflection.#keys(prototype, root, Object.getOwnPropertyNames)
  }

  static *symbols(prototype, root = Object) {
    yield *Reflection.#keys(prototype, root, Object.getOwnPropertySymbols)
  }

  static *namesAndSymbols(prototype, root = Object) {
    yield* Reflection.names(prototype, root)
    yield* Reflection.symbols(prototype, root)
  }

  static *memberNamesAndSymbols(prototype, root = Object) {
    yield *Reflection.#keys(prototype, root, Reflection.ownMemberNamesAndSymbols)
  }

  static *ownNamesAndSymbols(prototype) {
    yield *Reflect.ownKeys(prototype)
  }

  static *ownMemberNamesAndSymbols(prototype) {
    for (const name of Reflection.ownNamesAndSymbols(prototype)) {
      if (KnownInstanceMembers.has(name)) continue
      yield name
    }
  }

  static *ownStaticMemberNamesAndSymbols(type) {
    for (const name of Reflection.ownNamesAndSymbols(type)) {
      if (KnownStaticMembers.has(name)) continue
      yield name
    }
  }
}
