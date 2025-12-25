import { getOwn } from '@kingjs/get-own'
import { asIterable } from '@kingjs/as-iterable'
import { assert } from '@kingjs/assert'
import { Reflection } from '@kingjs/reflection'

// A general purpose global map of type to associated metadata
const Associations = new Map()

function objectLoad(type, symbol, fn) {

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
    if (!fn) return undefined

    // create and cache
    cache = fn(type)
    typeCache.set(symbol, cache)
  }

  return cache
}
function setLoad(type, symbol) {
  return objectLoad(type, symbol, () => new Set())
}
function mapLoad(type, symbol) {
  return objectLoad(type, symbol, () => new Map())
}
function lookupLoad(type, symbol, key) {
  // returns set of associated types for key
  const map = mapLoad(type, symbol)
  let set = map.get(key)
  if (!set) {
    set = new Set()
    map.set(key, set)
  }
  return set
}

export class Associate {

  static *ownTypes(type, symbols) {

    // if symbols typeof symbol, pull metadata off of type
    if (typeof symbols == 'symbol') symbols = type[symbols]
    assert(symbols != null, 'failed to find metadata symbols on type.')
    
    // symbols like { [TheSymbol]: { expectedType, map } }
    for (const symbol of Object.getOwnPropertySymbols(symbols)) {
      const options = symbols[symbol]
      const { expectedType, map } = options
      const expectedTypes = [...asIterable(expectedType)]

      const metadata = Associate.iterable(type, symbol)
      for (let associatedType of asIterable(metadata)) {
        if (map) associatedType = map(associatedType)
  
        // assert if associated type fails to extend any expected type
        const isValid = !expectedTypes.length || 
          expectedTypes.filter(expectedType => 
            Reflection.isExtensionOf(associatedType, expectedType)
          ).length > 0
          
        if (!isValid) 
          throw `Associate type "${associatedType.name}" is of an unexpected type.`
       
        yield associatedType
      }
    }
  }
  static *types(type, symbols, options = { }) {
    if (!options.visited) options = { ...options, visited: new Set() }
    const { traverse, visited } = options
    
    for (const prototype of Reflection.prototypeHierarchy(type)) {
      for (const associatedType of Associate.ownTypes(prototype, symbols)) {

        if (visited.has(associatedType)) continue
        visited.add(associatedType)
        yield associatedType

        if (traverse)
          yield* Associate.types(associatedType, symbols, options)
      }
    }
  }

  static iterable(type, symbol) {
    return objectLoad(type, symbol) || []
  }

  static objectInitialize(type, symbol, fn) {
    return objectLoad(type, symbol, fn)
  }
  static setAdd(type, symbol, ...values) {
    const set = setLoad(type, symbol)
    for (const value of values) {
      assert(value != null, 'value must be non-null')
      set.add(value)
    }
  }
  static mapSet(type, symbol, key, value) {
    assert(value != null, 'value must be non-null')
    assert(key != null, 'key must be non-null')

    const map = mapLoad(type, symbol)
    map.set(key, value)
  }
  static lookupAdd(type, symbol, key, ...values) {
    const set = lookupLoad(type, symbol, key)
    for (const value of values) {
      assert(value != null, 'value must be non-null')
      set.add(value)
    }
  }

  static objectCopy(type, sourceType, symbol) {
    const value = Associate.objectGet(sourceType, symbol)
    Associate.objectInitialize(type, symbol, () => value)
  }
  static setCopy(type, sourceType, symbol) {
    const values = Associate.setGet(sourceType, symbol)
    Associate.setAdd(type, symbol, ...values)
  }
  static mapCopy(type, sourceType, symbol, key) {
    const value = Associate.mapGet(sourceType, symbol, key)
    Associate.mapSet(type, symbol, key, value)
  }
  static lookupCopy(type, sourceType, symbol, key) {
    const values = Associate.lookupGet(sourceType, symbol, key)
    Associate.lookupAdd(type, symbol, key, ...values)
  }

  static objectGetOwn(type, symbol) {
    return objectLoad(type, symbol)
  }
  static *setGetOwn(type, symbol) {
    const set = objectLoad(type, symbol)
    if (!set) return
    yield* set
  }
  static mapGetOwn(type, symbol, key) {
    const map = objectLoad(type, symbol)
    return map?.get(key)
  }
  static *lookupGetOwn(type, symbol, key) {
    const map = objectLoad(type, symbol)
    yield* map?.get(key) || []
  }

  static objectGet(type, symbol) {
    while (type) {
      const value = Associate.objectGetOwn(type, symbol)
      if (value) return value
      type = Object.getPrototypeOf(type)
    }
  }
  static *setGet(type, symbol) {
    const set = new Set()
    while (type) {
      for (const value of Associate.setGetOwn(type, symbol)) {
        if (set.has(value)) continue
        yield value
        set.add(value)
      }
      type = Object.getPrototypeOf(type)
    }
  }
  static mapGet(type, symbol, key) {
    while (type) {
      const value = Associate.mapGetOwn(type, symbol, key)
      if (value) return value
      type = Object.getPrototypeOf(type)
    }
  }
  static *lookupGet(type, symbol, key) {
    const set = new Set()
    while (type) {
      for (const value of Associate.lookupGetOwn(type, symbol, key)) {
        if (set.has(value)) continue
        yield value
        set.add(value)
      }
      type = Object.getPrototypeOf(type)
    }
  }

  static setDelete(type, symbol, value) {
    const set = objectLoad(type, symbol)
    set?.delete(value)
  }
}
