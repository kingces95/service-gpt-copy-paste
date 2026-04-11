import { assert } from '@kingjs/assert'
import { Descriptor } from '@kingjs/descriptor'
import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { instanceOf } from '@kingjs/instance-of'

class Es6PrototypeCache {
  #host
  #cache
  #getPrototype

  constructor(host, getPrototype) {
    this.#host = host
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
      prototype = this.#getPrototype.call(this.#host, type)
      this.#cache.set(type, prototype)
    }
    return prototype
  }
}

export class Es6Prototype {

  static deconstruct(prototype) {
    const chain = []
    do { 
      const link = Object.create(null)
      Object.defineProperties(link,
        Object.getOwnPropertyDescriptors(prototype))
      chain.push(link) 
    } 
    while (prototype = Object.getPrototypeOf(prototype))
    return chain
  }

  static create(links) {
    // links like { type, descriptors }, subtype first
    return [...links].reverse().reduce((prototype, { type, descriptors }) => {
      prototype = Es6Prototype.createLink(type, prototype, descriptors)
      return prototype
    }, null)
  }

  static createLink(type, basePrototype = null, descriptors = { }) {
    // add link to base prototype chain
    const prototype = Object.create(basePrototype)

    // define .constructor to be type
    Object.defineProperty(prototype, 'constructor', {
      value: type,
      configurable: true,
      enumerable: false,
      writable: false,
    })

    // define descriptors on prototype
    Object.defineProperties(prototype, descriptors)
    
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

  static #getOwnDescriptor(prototype, name) {
    return Object.getOwnPropertyDescriptor(prototype, name)
  }

  static getOwnDescriptor(prototype, name, descriptorType) {
    const descriptor = Es6Prototype.#getOwnDescriptor(prototype, name)
    return Es6Descriptor.filter(descriptor, { descriptorType }) 
      ? descriptor : null
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
    this.#cache = new Es6PrototypeCache(this, getPrototypeFn)
  }

  #instanceOfFilter(type) {
    return type 
      ? ({ value }) => instanceOf(value, type)
      : () => true
  }

  getPrototype(type) {
    return this.#cache.getPrototype(type)
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

  *hierarchy(type) {
    const prototype = this.getPrototype(type)
    for (const link of Es6Prototype.chain(prototype))
      yield link.constructor
  }
  
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

  *ownValues(type, { instance, 
    descriptorType, instanceOf } = { }) {
    const descriptors = this.ownDescriptors(type, { descriptorType })
    yield *Es6Descriptor.values(descriptors, instance)
      .filter(this.#instanceOfFilter(instanceOf))
  }

  *getValue(type, name, { instance, 
    descriptorType, instanceOf } = { }) {
    const descriptors = this.getDescriptor(type, name, { 
      descriptorType, includeOverridden: true })
    yield* Es6Descriptor.values(descriptors, instance)
      .filter(this.#instanceOfFilter(instanceOf))
  }

  *values(type, { instance, includeOverridden, 
    descriptorType, instanceOf } = { }) {
    const descriptors = this.descriptors(type, { 
      includeOverridden, descriptorType })
    yield *Es6Descriptor.values(descriptors, instance, { descriptorType })
      .filter(this.#instanceOfFilter(instanceOf))
  }

  *hosts(type, name) {
    for (const current of this.hierarchy(type))
      if (this.hasKey(current, name)) yield current
  }

  getOwnDescriptor(type, name, { descriptorType } = { }) {
    if (!this.hasOwnKey(type, name)) return null
    const prototype = this.getPrototype(type)
    return Es6Prototype.getOwnDescriptor(
      prototype, name, descriptorType)
  }

  *ownDescriptors(type, { descriptorType } = { }) {
    for (const key of this.ownKeys(type)) {
      const descriptor = this.getOwnDescriptor(
        type, key, { descriptorType })
      if (!descriptor) continue

      yield key
      yield descriptor
    }
  }  

  *getDescriptor(type, name, { descriptorType } = { }) {
    const prototype = this.getPrototype(type)
    for (const current of Es6Prototype.chain(prototype)) {  
      const ctor = current.constructor
      if (this.isKnownKey(ctor, name)) continue

      const descriptor = Es6Prototype.getOwnDescriptor(
        current, name, descriptorType)
      if (!descriptor) continue

      yield ctor
      yield descriptor
    } 
  }

  *descriptors(type, { descriptorType, includeOverridden } = { }) {
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
          const descriptor = this.getOwnDescriptor(
            owner, key, { descriptorType })
          if (!descriptor) continue
            
          yield key
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
