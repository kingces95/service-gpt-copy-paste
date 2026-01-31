import assert from 'assert'
import { getOwn } from '@kingjs/get-own'
import { asIterable } from '@kingjs/as-iterable'
import { Es6Reflect } from '@kingjs/es6-reflect'

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
            Es6Reflect.isExtensionOf(associatedType, expectedType)
          ).length > 0
          
        if (!isValid) 
          throw `Associate type "${associatedType.name}" is of an unexpected type.`
       
        yield associatedType
      }
    }
  }
  static *types(type, symbols, options = { }) {
    if (!options.visited) options = { ...options, visited: new Set() }
    // const { traverse, visited } = options
    const { visited } = options
    
    for (const current of Es6Reflect.hierarchy(type)) {
      for (const associatedType of Associate.ownTypes(current, symbols)) {

        if (visited.has(associatedType)) continue
        visited.add(associatedType)
        yield associatedType

        // assert(!traverse)
        // if (traverse)
        //   yield* Associate.types(associatedType, symbols, options)
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
  static *lookupGet(type, symbol, key, dfaultValue) {
    const set = new Set()
    while (type) {
      for (const value of Associate.lookupGetOwn(type, symbol, key)) {
        if (set.has(value)) continue
        yield value
        set.add(value)
      }
      type = Object.getPrototypeOf(type)
    }
    if (set.size == 0 && dfaultValue !== undefined)
      yield dfaultValue
  }
}
