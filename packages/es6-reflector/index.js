import assert from 'assert'
import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { es6Typeof } from '@kingjs/es6-typeof'

const KnownTypes = [ Object, Function ]
const KnownInstanceKeys = [ 'constructor' ]
const KnownStaticKeys = [ 'length', 'name', 'prototype' ]

class Es6Prototype {

  static *chain(prototype) {
    do { yield prototype } 
    while (prototype = Object.getPrototypeOf(prototype))
  }

  static hasOwnKey(prototype, name) {
    return Object.prototype.hasOwnProperty.call(prototype, name)
  }

  static *ownKeys(prototype) {
    yield* Reflect.ownKeys(prototype)
  }

  static getOwnDescriptor(prototype, name) {
    return Object.getOwnPropertyDescriptor(prototype, name)
  }
}

export class Es6Reflector {
  #knownTypes
  #knownInstanceKeys
  #knownStaticKeys
  #getPrototypeFn
  #fixedOptions
  
  constructor({
    knownTypes = KnownTypes,
    knownStaticKeys = KnownStaticKeys,
    knownInstanceKeys = KnownInstanceKeys, 
    fixedOptions = { },
    getPrototypeFn = type => type.prototype,
  } = { }) {
    this.#knownTypes = new Set(knownTypes)
    this.#knownInstanceKeys = new Set(knownInstanceKeys)
    this.#knownStaticKeys = new Set(knownStaticKeys)
    this.#fixedOptions = fixedOptions
    this.#getPrototypeFn = getPrototypeFn
  }

  #getOptions(options) {
    return { ...options, ...this.#fixedOptions }
  }

  #getPrototype(type, { isStatic }) {
    return isStatic ? type : this.#getPrototypeFn(type)
  }

  typeof(fn, key, descriptor, { isStatic } = { }) {
    const descriptorType = Es6Descriptor.typeof(descriptor)
    if (descriptorType != 'field')
      return descriptorType

    const value = descriptor.value
    const es6Type = es6Typeof(value)
    if (key === 'constructor' 
      && !isStatic 
      && value === fn) {

      assert(es6Type == 'class')
      return 'constructor'
    }

    return 'field'
  }

  *hierarchy(type, { isStatic } = { }) {
    let prototype = this.#getPrototypeFn(type)
    for (const link of Es6Prototype.chain(prototype)) {
      const ctor = link.constructor
      // TODO: why suppress Object for static members?
      if (type != Object && isStatic && ctor == Object) break
      yield ctor
    }
  }

  *baseTypes(type, options = { }) {
    const hierarchy = this.hierarchy(type, options)
    hierarchy.next() // skip self
    yield* hierarchy
  }

  isExtensionOf(type, target) {
    for (const base of this.baseTypes(type))
      if (base == target) return true
    return false
  }

  isAbstract(type) {
    return type != Object && !this.isExtensionOf(type, Object)
  }

  isKnown(type) { 
    return this.#knownTypes.has(type) 
  }

  isKnownKey(type, name, { isStatic } = { }) {
    if (this.isKnown(type)) return true

    if (isStatic) 
      return this.#knownStaticKeys.has(name)

    return this.#knownInstanceKeys.has(name)
  }

  hasOwnKey(type, name, options = { }) {
    const { excludeKnown } = this.#getOptions(options)
    const prototype = this.#getPrototype(type, options)

    if (excludeKnown && this.isKnownKey(type, name, options))
      return false

    return Es6Prototype.hasOwnKey(prototype, name)
  }

  *ownKeys(type, options = { }) {
    const prototype = this.#getPrototype(type, options)

    for (const name of Es6Prototype.ownKeys(prototype)) {
      if (!this.hasOwnKey(type, name, options))
        continue
      yield name
    }
  }

  *keys(type, options = { }) {
    const visited = new Set()

    for (const current of this.hierarchy(type, options)) {
      yield current
      for (const key of this.ownKeys(current, options)) {
        if (visited.has(key)) continue
        visited.add(key)
        yield key
      }
    }
  }

  isHostOf(type, name, options = { }) {
    if (this.isKnownKey(type, name, options)) return false
    return name in this.#getPrototype(type, options)
  }

  *getHosts(type, name, options = { }) {
    for (const current of this.hierarchy(type, options)) {
      if (this.isHostOf(current, name, options)) yield current
    }
  }

  getOwnDescriptor(type, name, options = { }) {
    const prototype = this.#getPrototype(type, options)
    
    if (!this.hasOwnKey(type, name, options))
      return null

    return Es6Prototype.getOwnDescriptor(prototype, name)
  }

  *ownDescriptors(type, options = { }) {
    for (const key of this.ownKeys(type, options)) {
      yield key
      yield this.getOwnDescriptor(type, key, options)
    }
  }  

  *getDescriptor(type, name, options = { }) {
    for (const current of this.hierarchy(type, options)) {  
      const descriptor = this.getOwnDescriptor(current, name, options)
      if (!descriptor) continue
      yield current
      yield descriptor
    }
  }

  *descriptors(type, options = { }) {
    let owner
    for (const current of this.keys(type, options)) {
      switch (typeof current) {
        case 'function': 
          owner = current
          yield owner
          break
        case 'string':
        case 'symbol': {
          const descriptor = this.getOwnDescriptor(owner, current, options)
          yield current
          yield descriptor
          break
        }
        default: assert(false, `Unexpected type: ${typeof current}`)
      }
    }
  }
}
