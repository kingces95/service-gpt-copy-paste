import { getOwn } from '@kingjs/get-own'
import { asIterable } from '@kingjs/as-iterable'
import { assert } from '@kingjs/assert'

const KnownInstanceMembers = new Set([ 'constructor'])
const KnownStaticMembers = new Set([ 'length', 'name', 'prototype'])

export class Reflection {
  static isExtensionOf(childClass, parentClass) {
    let prototype = childClass
    while (prototype) {
      if (prototype === parentClass) return true
      prototype = Object.getPrototypeOf(prototype)
    }
    return false
  }

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

  static isKnownInstanceMember(name) {
    return KnownInstanceMembers.has(name)
  }

  static isKnownStaticMember(name) {
    return KnownStaticMembers.has(name)
  }

  static *ownMemberNamesAndSymbols(prototype) {
    for (const name of Reflection.ownNamesAndSymbols(prototype)) {
      if (Reflection.isKnownInstanceMember(name)) continue
      yield name
    }
  }

  static *ownStaticMemberNamesAndSymbols(prototype) {
    for (const name of Reflection.ownNamesAndSymbols(prototype)) {
      if (Reflection.isKnownStaticMember(name)) continue
      yield name
    }
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
    yield* Reflection.prototypes(target)
  }
}
