import assert from 'assert'

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

  // get runtime map
  let object = typeMap.get(symbol)
  if (!object) {

    // no fn, no value
    if (!fn) return null

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

export class Associate {

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
    return map?.get(key) || null
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
    return null
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
    return null
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
