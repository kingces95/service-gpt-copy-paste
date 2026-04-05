import { assert } from '@kingjs/assert'
import { Descriptor } from '@kingjs/descriptor'
import { Es6Descriptor } from '@kingjs/es6-descriptor'

class Es6PrototypeCache {
  #cache
  #getPrototype

  constructor(getPrototype) {
    this.#getPrototype = getPrototype
  }

  getPrototype(type) {
    if (!type) return null

    if (!this.#getPrototype)
      return type.prototype

    if (!this.#cache)
      this.#cache = new WeakMap()

    let prototype = this.#cache.get(type)
    if (!prototype) {
      prototype = this.#getPrototype(type)
      this.#cache.set(type, prototype)
    }
    return prototype
  }
}

export class Es6Prototype {

  static create(links) {
    // links like { type, descriptors }
    return links.reduce((prototype, { type, descriptors }) => {
      prototype = Es6Prototype.createLink(type, prototype, descriptors)
      return prototype
    }, null)
  }

  static createLink(type, basePrototype = null, descriptors = { }) {
    // add link to base prototype chain
    const prototype = Object.create(basePrototype)

    // define descriptors on prototype
    Object.defineProperties(prototype, descriptors)

    // define .constructor to be type
    Object.defineProperty(prototype, 'constructor', {
      value: type,
      configurable: true,
      enumerable: false,
      writable: false,
    })
    
    return prototype    
  }

  static *chain(prototype) {
    do { yield prototype } 
    while (prototype = Object.getPrototypeOf(prototype))
  }

  static hasOwnKey(prototype, name) {
    return Object.prototype.hasOwnProperty.call(prototype, name)
  }

  static hasKey(prototype, name) {
    return name in prototype
  }

  static *ownKeys(prototype) {
    yield* Reflect.ownKeys(prototype)
  }

  static getOwnDescriptor(prototype, name) {
    return Object.getOwnPropertyDescriptor(prototype, name)
  }

  #cache
  #knownTypes 
  #knownTypeFn
  #knownKeys
  #knownKeyFn

  constructor({
    knownTypes = [], knownTypeFn,
    knownKeys = [], knownKeyFn,
    getPrototypeFn = null,
  } = { }) {
    this.#knownTypes = new Set(knownTypes)
    this.#knownTypeFn = knownTypeFn
    this.#knownKeys = new Set(knownKeys)
    this.#knownKeyFn = knownKeyFn
    this.#cache = new Es6PrototypeCache(getPrototypeFn)
  }

  getPrototype(type) {
    return this.#cache.getPrototype(type)
  }

  *hierarchy(type) {
    const prototype = this.getPrototype(type)
    for (const link of Es6Prototype.chain(prototype))
      yield link.constructor
  }
  
  *hierarchy$(type) {
    const prototype = this.getPrototype(type)
    for (const link of Es6Prototype.chain(prototype)) {
      yield link.constructor
      yield link
    }
  }

  isKnown(type) {
    if (!type) return false
    return this.#knownTypes.has(type) 
      || this.#knownTypeFn?.(type) == true
  }
  isKnownKey(type, name) {
    if (this.isKnown(type)) return true
    return this.#knownKeys.has(name)
      || this.#knownKeyFn?.(type, name) == true
  }

  *knownKeys() { yield* this.#knownKeys }
  *knownTypes() { yield* this.#knownTypes }

  getBaseType(type) {
    const baseTypes = this.baseTypes(type)
    const { value } = baseTypes.next()
    return value || null
  }

  *baseTypes(type) {
    const hierarchy = this.hierarchy(type)
    hierarchy.next() // skip self
    yield* hierarchy
  }

  hasOwnKey(type, name) {
    if (this.isKnownKey(type, name)) return false
    const prototype = this.getPrototype(type)
    return Es6Prototype.hasOwnKey(prototype, name)
  }

  hasKey(type, name) {
    if (this.isKnownKey(type, name)) return false
    const prototype = this.getPrototype(type)
    return Es6Prototype.hasKey(prototype, name)
  }

  *ownKeys(type) {
    const prototype = this.getPrototype(type)
    for (const name of Es6Prototype.ownKeys(prototype)) {
      if (this.isKnownKey(type, name)) continue
      yield name
    }
  }

  *keys(type, { includeOverridden = false } = { }) {
    const prototype = this.getPrototype(type)
    
    const visited = new Set()
    for (const current of Es6Prototype.chain(prototype)) {
      const ctor = current.constructor
      yield ctor
      for (const key of Es6Prototype.ownKeys(current)) {
        if (!includeOverridden && visited.has(key)) continue
        if (this.isKnownKey(ctor, key)) 
          continue
        visited.add(key)
        yield key
      }
    }
  }

  *ownValues(type, instance, { 
    descriptorType, valueFilter } = { }) {

    yield *Es6Descriptor.values(
      this.ownDescriptors(type), 
        instance, { descriptorType, valueFilter })
  }

  *values(type, instance, { 
    descriptorType, valueFilter, includeOverridden } = { }) {

    yield *Es6Descriptor.values(
      this.descriptors(type, { includeOverridden }), 
        instance, { descriptorType, valueFilter })
  }

  *ownHosts(type, name) {
    for (const current of this.hierarchy(type))
      if (this.hasOwnKey(current, name)) yield current
  }

  *hosts(type, name) {
    for (const current of this.hierarchy(type))
      if (this.hasKey(current, name)) yield current
  }

  getImplementingHost(type, name) {
    for (const current of this.hierarchy(type))
      if (this.hasOwnKey(current, name)) return current
    return null
  }

  getOwnDescriptor(type, name) {
    if (!this.hasOwnKey(type, name)) return null
    const prototype = this.getPrototype(type)
    return Es6Prototype.getOwnDescriptor(prototype, name)
  }

  *ownDescriptors(type) {
    for (const key of this.ownKeys(type)) {
      yield key
      yield this.getOwnDescriptor(type, key)
    }
  }  

  *getDescriptor(type, name) {
    const prototype = this.getPrototype(type)
    for (const current of Es6Prototype.chain(prototype)) {  
      const descriptor = Es6Prototype.getOwnDescriptor(current, name)
      if (!descriptor) continue
      const ctor = current.constructor
      if (this.isKnownKey(ctor, name)) continue
      yield ctor
      yield descriptor
    } 
  }

  *descriptors(type, { includeOverridden = false } = { }) {
    let owner
    for (const current of this.keys(type, { includeOverridden })) {
      const typeofCurrent = typeof current
      assert(typeofCurrent == 'function'
        || typeofCurrent == 'string'
        || typeofCurrent == 'symbol', 
        `Unexpected type: ${typeof current}`)

      switch (typeofCurrent) {
        case 'function': 
          owner = current
          yield owner
          break
        case 'string':
        case 'symbol': {
          const key = current
          yield key

          const descriptor = this.getOwnDescriptor(owner, current)
          yield descriptor
          break
        }
      }
    }
  }

  canDuckCast(type, instance) {
    let owner
    let name
    let instanceDescriptor, instanceType
    for (const current of this.descriptors(type)) {
      switch (typeof current) {
        case 'function': 
          owner = current
          break

        case 'string': 
        case 'symbol': 
          name = current
          if (!(name in instance)) return false 
          // TODO: Consider using Es6Descriptor
          instanceDescriptor = Descriptor.get(instance, name)
          instanceType = Descriptor.typeof(instanceDescriptor)
          break

        case 'object': {
          const descriptorType = Descriptor.typeof(current)
          assert(descriptorType == 'data' 
            || descriptorType == 'getter' 
            || descriptorType == 'setter'
            || descriptorType == 'property',
            `Unexpected descriptor type: ${descriptorType}`)

          if (instanceType == descriptorType) continue
          if (instanceType == 'property') {
            if (descriptorType == 'getter') continue
            if (descriptorType == 'setter') continue
          }
          return false
        }
      }
    }
    return true
  }
}
