import { getOwn } from '@kingjs/get-own'
import { asArray } from '@kingjs/as-array'
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

  static *ownStaticMemberNamesAndSymbols(type) {
    for (const name of Reflection.ownNamesAndSymbols(type)) {
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

  static addAssociatedType(type, symbol, associatedType) {
    const associatedTypes = getOwn(type, symbol) || []
    associatedTypes.push(associatedType)
    Object.defineProperty(type, symbol, {
      value: associatedTypes,
      configurable: true,
    })
  }
  static *ownAssociatedTypes(type, symbols, options = { }) {
    const { filterType: globalFilterType } = options
    
    // symbols like { [TheSymbol]: { filterType, expectedType, map } }
    for (const symbol of Object.getOwnPropertySymbols(symbols)) {
      const options = symbols[symbol]
      const { filterType, expectedType, map } = options

      if (globalFilterType && expectedType &&
        !Reflection.isExtensionOf(expectedType, globalFilterType))
        continue

      const types = asArray(getOwn(type, symbol))
      if (!types) return
  
      for (let type of types) {
        if (map) type = map(type)
  
        assert(!expectedType || 
          Reflection.isExtensionOf(type, expectedType), [
            `Expected associated type "${type.name}"`,
            `to be a ${expectedType?.name}.`
          ].join(' '))
  
        if (filterType && !Reflection.isExtensionOf(type, filterType)) 
          continue

        if (globalFilterType && !Reflection.isExtensionOf(type, globalFilterType))
          continue
       
        yield type
      }
    }
  }
  static *associatedTypes(type, symbols, options = { }) {
    if (!options.visited) options = { ...options, visited: new Set() }
    const { inherit, traverse, visited } = options
    
    for (const prototype of Reflection.prototypeHierarchy(type)) {
      for (const associatedType of Reflection.ownAssociatedTypes(
        prototype, symbols, options)) {

        if (visited.has(associatedType)) continue
        visited.add(associatedType)
        yield associatedType

        if (traverse)
          yield* Reflection.associatedTypes(associatedType, symbols, options)
      }

      if (!inherit) break
    }
  }

  static *associatedKeys(type, associatedTypesFn, keysFn) {
    const visited = new Set()

    function *types() {
      yield type
      yield* associatedTypesFn(type)
    }

    for (const associatedType of types()) {
      for (const key of keysFn(associatedType)) {
        if (visited.has(key)) continue
        visited.add(key)
        yield key
      }
    }
  }

  static associatedKeyMap(type, associatedTypesFn, keysFn) {
    // map of key to set of associated types defining the key
    const map = new Map()

    function *types() {
      yield type
      yield* associatedTypesFn(type)
    }

    for (const associatedType of types()) {
      for (const key of keysFn(associatedType)) {
        let set = map.get(key)
        if (!set) map.set(key, set = new Set())
        set.add(associatedType)
      }
    }

    return map
  }
}
