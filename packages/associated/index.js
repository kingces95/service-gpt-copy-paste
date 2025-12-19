import { getOwn } from '@kingjs/get-own'
import { asIterable } from '@kingjs/as-iterable'
import { assert } from '@kingjs/assert'
import { Reflection } from '@kingjs/reflection'

// A general purpose global map of type to associated metadata
const Associations = new Map()

export class Associated {

  static *ownTypes(type, symbols, options = { }) {
    const { filterType: globalFilterType } = options

    // if symbols typeof symbol, pull metadata off of type
    if (typeof symbols == 'symbol') symbols = type[symbols] || { }
    
    // symbols like { [TheSymbol]: { filterType, expectedType, map } }
    for (const symbol of Object.getOwnPropertySymbols(symbols)) {
      const options = symbols[symbol]
      const { filterType: localFilterType, expectedType, map } = options
      const expectedTypes = [...asIterable(expectedType)]

      const metadata = Associated.iterable(type, symbol)
      for (let associatedType of asIterable(metadata)) {
        if (map) associatedType = map(associatedType)
  
        // assert if associated type fails to extend any expected type
        const isValid = !expectedTypes.length || 
          expectedTypes.filter(
            expectedType => Reflection.isExtensionOf(associatedType, expectedType)
          ).length > 0
          
        if (!isValid)
          throw `Associated type "${associatedType.name}" is of an unexpected type.`
  
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
  static *types(type, symbols, options = { }) {
    if (!options.visited) options = { ...options, visited: new Set() }
    const { inherit, traverse, visited } = options
    
    for (const prototype of Reflection.prototypeHierarchy(type)) {
      for (const associatedType of Associated.ownTypes(
        prototype, symbols, options)) {

        if (visited.has(associatedType)) continue
        visited.add(associatedType)
        yield associatedType

        if (traverse)
          yield* Associated.types(associatedType, symbols, options)
      }

      if (!inherit) break
    }
  }

  static *keys(type, associatedTypesFn, keysFn) {
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

  static keyReduce(type, associatedTypesFn, keysFn, fn) {
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

  static keyMap(type, associatedTypesFn, keysFn) {
    // map of key to an associated types
    return Associated.keyReduce(
      type, associatedTypesFn, keysFn,
      (existing, associatedType) => existing || associatedType)
  }

  static keyLookup(type, associatedTypesFn, keysFn) {
    // map of key to set of associated types defining the key
    return Associated.keyReduce(
      type, associatedTypesFn, keysFn,
      (existing = new Set(), associatedType) => {
        existing.add(associatedType)
        return existing
      })
  }

  static object(type, symbol, fn) {

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
      cache = fn(type)
      typeCache.set(symbol, cache)
    }

    return cache
  }

  static set(type, symbol) {
    return Associated.object(type, symbol, () => new Set())
  }
  static map(type, symbol) {
    return Associated.object(type, symbol, () => new Map())
  }
  static lookup(type, symbol, key) {
    // returns set of associated types for key
    const map = Associated.map(type, symbol)
    let set = map.get(key)
    if (!set) {
      set = new Set()
      map.set(key, set)
    }
    return set
  }

  static mapSet(type, symbol, key, value) {
    assert(value != null, 'value must be non-null')
    assert(key != null, 'key must be non-null')

    const map = Associated.map(type, symbol)
    map.set(key, value)
  }
  static setAdd(type, symbol, ...values) {
    const set = Associated.set(type, symbol)
    for (const value of values) {
      assert(value != null, 'value must be non-null')
      set.add(value)
    }
  }
  static lookupAdd(type, symbol, key, ...values) {
    const set = Associated.lookup(type, symbol, key)
    for (const value of values) {
      assert(value != null, 'value must be non-null')
      set.add(value)
    }
  }

  static mapCopy(type, sourceType, symbol, key) {
    const value = Associated.mapGet(sourceType, symbol, key)
    if (!value) return
    Associated.mapSet(type, symbol, key, value)
  }
  static setCopy(type, sourceType, symbol) {
    const values = Associated.set(sourceType, symbol)
    Associated.setAdd(type, symbol, ...values)
  }
  static lookupCopy(type, sourceType, symbol, key) {
    const values = Associated.lookup(sourceType, symbol, key)
    Associated.lookupAdd(type, symbol, key, ...values)
  }

  static iterable(type, symbol) {
    return Associated.object(type, symbol) || []
  }
  static mapGet(type, symbol, key) {
    const map = Associated.object(type, symbol)
    return map?.get(key)
  }
  static lookupGet(type, symbol, key) {
    const map = Associated.object(type, symbol)
    return map?.get(key)
  }

  static setDelete(type, symbol, value) {
    const set = Associated.object(type, symbol)
    set?.delete(value)
  }
}
