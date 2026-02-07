import assert from 'assert'
import { getOwn } from '@kingjs/get-own'
import { asIterable } from '@kingjs/as-iterable'
import { Es6Reflect } from '@kingjs/es6-reflect'

// A general purpose global map of type to associated metadata
const Associations = new Map()

function objectLoad(type, symbol, fn) {

  // get type map
  let typeMap = Associations.get(type)
  if (!typeMap) {

    // create type map
    typeMap = new Map()
    Associations.set(type, typeMap)
  }

  // try declared
  const declaredCache = getOwn(type, symbol)
  if (declaredCache) return declaredCache

  // get runtime map
  let object = typeMap.get(symbol)
  if (!object) {

    // no fn, no value
    if (!fn) return undefined

    // create and load value
    object = fn(type)
    typeMap.set(symbol, object)
  }

  return object
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

function isExtensionOfAny(type, expectedType) {
  if (!expectedType) return true
  
  const expectedTypes = [...asIterable(expectedType)]
  if (!expectedTypes.length) return true

  for (const expectedType of expectedTypes)
    if (Es6Reflect.isExtensionOf(type, expectedType))
      return true
  return false
}

export class Associate {
  static *ownDescriptors(type, symbols) {

    // if symbols typeof symbol, pull metadata off of type
    if (typeof symbols == 'symbol') symbols = type[symbols]
    assert(symbols != null, 'failed to find metadata symbols on type.')
    
    // symbols like { [TheSymbol]: { ...options } }
    for (const symbol of Object.getOwnPropertySymbols(symbols)) {
      yield symbol

      const descriptor = Object.getOwnPropertyDescriptor(type, symbol)
      if (!descriptor) continue

      yield descriptor
    }
  }
  
  static *ownTypes(type, symbols) {
    if (typeof symbols == 'symbol') symbols = type[symbols]

    let symbol, options
    for (const current of Associate.ownDescriptors(type, symbols)) {
      switch (typeof current) {
        case 'symbol': 
          symbol = current
          options = symbols[symbol] || { }
          break
        case 'object':
          const { value } = current
          const { expectedType, map = o => o } = options
          const types = asIterable(value).map(map)

          for (const type of types) {
            assert(isExtensionOfAny(type, expectedType),
              `Associate type "${type.name}" is of an unexpected type.`)
            yield type
          }
          break
        default: assert(false, `Unexpected type: ${typeof current}`)
      }
    }
  }
  // static *ownTypes2(type, symbols) {

  //   // if symbols typeof symbol, pull metadata off of type
  //   if (typeof symbols == 'symbol') symbols = type[symbols]
  //   assert(symbols != null, 'failed to find metadata symbols on type.')
    
  //   // symbols like { [TheSymbol]: { expectedType, map } }
  //   for (const symbol of Object.getOwnPropertySymbols(symbols)) {
  //     const options = symbols[symbol]
  //     const { expectedType, map } = options
  //     const expectedTypes = [...asIterable(expectedType)]

  //     const associatedTypes = Associate.iterable(type, symbol)
  //     for (let associatedType of asIterable(associatedTypes)) {
  //       if (map) associatedType = map(associatedType)
  
  //       // assert if associated type fails to extend any expected type
  //       const isValid = !expectedTypes.length || 
  //         expectedTypes.filter(expectedType => 
  //           Es6Reflect.isExtensionOf(associatedType, expectedType)
  //         ).length > 0
          
  //       if (!isValid) 
  //         throw `Associate type "${associatedType.name}" is of an unexpected type.`
       
  //       yield associatedType
  //     }
  //   }
  // }
  static *types(type, symbols, options = { }) {
    if (!options.visited) options = { ...options, visited: new Set() }
    const { visited } = options
    
    for (const current of Es6Reflect.hierarchy(type)) {
      for (const associatedType of Associate.ownTypes(current, symbols)) {

        if (visited.has(associatedType)) continue
        visited.add(associatedType)
        yield associatedType
      }
    }
  }

  static iterable(type, symbol) {
    // return objectLoad(type, symbol) || []
    return getOwn(type, symbol) || []
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
}
