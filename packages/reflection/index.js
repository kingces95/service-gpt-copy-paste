import { getOwn } from '@kingjs/get-own'
import { asIterable } from '@kingjs/as-iterable'
import { assert } from '@kingjs/assert'

const KnownInstanceMembers = new Set([ 'constructor'])
const KnownStaticMembers = new Set([ 'length', 'name', 'prototype'])

// A general purpose global map of type to associated metadata
const Associations = new Map()

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

  static *ownAssociatedTypes(type, symbols, options = { }) {
    const { filterType: globalFilterType } = options

    // if symbols typeof symbol, pull metadata off of type
    if (typeof symbols == 'symbol') symbols = type[symbols] || { }
    
    // symbols like { [TheSymbol]: { filterType, expectedType, map } }
    for (const symbol of Object.getOwnPropertySymbols(symbols)) {
      const options = symbols[symbol]
      const { filterType: localFilterType, expectedType, map } = options

      if (globalFilterType && expectedType &&
        !Reflection.isExtensionOf(expectedType, globalFilterType))
        continue

      const metadata = Reflection.associatedIterable(type, symbol)
      for (let associatedType of asIterable(metadata)) {
        if (map) associatedType = map(associatedType)
  
        assert(!expectedType || 
          Reflection.isExtensionOf(associatedType, expectedType), [
            `Expected associated type "${associatedType.name}"`,
            `to be a ${expectedType?.name}.`
          ].join(' '))
  
        if (localFilterType 
          && !Reflection.isExtensionOf(associatedType, localFilterType)) 
          continue

        if (globalFilterType 
          && !Reflection.isExtensionOf(associatedType, globalFilterType))
          continue
       
        yield associatedType
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

  static associatedKeyReduce(type, associatedTypesFn, keysFn, fn) {
    const map = new Map()

    function *types() {
      yield type
      yield* associatedTypesFn(type)
    }

    for (const associatedType of types()) {
      for (const key of keysFn(associatedType)) {
        map.set(key, fn(map.get(key), associatedType))
      }
    }

    return map
  }

  static associatedKeyMap(type, associatedTypesFn, keysFn) {
    // map of key to an associated types
    return Reflection.associatedKeyReduce(
      type, associatedTypesFn, keysFn,
      (existing, associatedType) => existing || associatedType)
  }

  static associatedKeyLookup(type, associatedTypesFn, keysFn) {
    // map of key to set of associated types defining the key
    return Reflection.associatedKeyReduce(
      type, associatedTypesFn, keysFn,
      (existing = new Set(), associatedType) => {
        existing.add(associatedType)
        return existing
      })
  }

  static associatedObject(type, symbol, fn) {

    // get type cache
    let typeCache = Associations.get(type)
    if (!typeCache) {

      // create type cache
      typeCache = new Map()
      Associations.set(type, typeCache)
    }

    // try declared cache
    const declaredCache = getOwn(type, symbol)
    if (declaredCache) return declaredCache

    // get runtime cache
    let cache = typeCache.get(symbol)
    if (!cache) {

      // no fn, no cache
      if (!fn) return null

      // create and cache
      cache = fn()
      typeCache.set(symbol, cache)
    }

    return cache
  }

  static associatedSet(type, symbol) {
    return Reflection.associatedObject(type, symbol, () => new Set())
  }
  static associatedMap(type, symbol) {
    return Reflection.associatedObject(type, symbol, () => new Map())
  }
  static associatedLookup(type, symbol, key) {
    // returns set of associated types for key
    const map = Reflection.associatedMap(type, symbol)
    let set = map.get(key)
    if (!set) {
      set = new Set()
      map.set(key, set)
    }
    return set
  }

  static associatedMapSet(type, symbol, key, value) {
    assert(value != null, 'value must be non-null')
    assert(key != null, 'key must be non-null')

    const map = Reflection.associatedMap(type, symbol)
    map.set(key, value)
  }
  static associatedSetAdd(type, symbol, ...values) {
    const set = Reflection.associatedSet(type, symbol)
    for (const value of values) {
      assert(value != null, 'value must be non-null')
      set.add(value)
    }
  }
  static associatedLookupAdd(type, symbol, key, ...values) {
    const set = Reflection.associatedLookup(type, symbol, key)
    for (const value of values) {
      assert(value != null, 'value must be non-null')
      set.add(value)
    }
  }

  static associatedMapCopy(type, sourceType, symbol, key) {
    const value = Reflection.associatedMapGet(sourceType, symbol, key)
    if (!value) return
    Reflection.associatedMapSet(type, symbol, key, value)
  }
  static associatedSetCopy(type, sourceType, symbol) {
    const values = Reflection.associatedSet(sourceType, symbol)
    Reflection.associatedSetAdd(type, symbol, ...values)
  }
  static associatedLookupCopy(type, sourceType, symbol, key) {
    const values = Reflection.associatedLookup(sourceType, symbol, key)
    Reflection.associatedLookupAdd(type, symbol, key, ...values)
  }

  static associatedIterable(type, symbol) {
    return Reflection.associatedObject(type, symbol) || []
  }
  static associatedMapGet(type, symbol, key) {
    const map = Reflection.associatedObject(type, symbol)
    return map?.get(key)
  }
  static associatedLookupGet(type, symbol, key) {
    const map = Reflection.associatedObject(type, symbol)
    return map?.get(key)
  }
}
