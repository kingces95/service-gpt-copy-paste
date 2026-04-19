import { assert } from '@kingjs/assert'
import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { instanceOf } from '@kingjs/instance-of'
import { asSet } from '@kingjs/as-set'
import { Prototype } from '@kingjs/prototype'

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

  static #isTypeof(descriptor, descriptorType) {
    if (!descriptor) return false

    if (descriptorType) {
      descriptorType = asSet(descriptorType)
      if (!descriptorType.has(Es6Descriptor.typeof(descriptor))) 
        return false
    }

    return true
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
    yield* Prototype.chain(prototype)
      .map(link => link.constructor)
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
    return Prototype.hasOwnKey(prototype, name)
  }

  hasKey(type, name) {
    if (this.isKnownKey(type, name)) return false
    const prototype = this.getPrototype(type)
    return Prototype.hasKey(prototype, name)
  }

  *ownKeys(type) {
    const prototype = this.getPrototype(type)
    yield *Prototype.ownKeys(prototype)
      .filter(name => !this.isKnownKey(type, name))
  }

  *keys(type, { includeOverridden = false } = { }) {
    const prototype = this.getPrototype(type)
    yield* Prototype.keys(prototype, { 
      includeOverridden, 
      filter: (type, key) => !this.isKnownKey(type, key) 
    })
  }

  getOwnDescriptor(type, name, { descriptorType } = { }) {
    if (!this.hasOwnKey(type, name)) return null
    const prototype = this.getPrototype(type)
    const descriptor = Prototype.getOwnDescriptor(prototype, name)
    if (!Es6Prototype.#isTypeof(descriptor, descriptorType)) return null
    return descriptor
  }

  *ownDescriptors(type, { descriptorType } = { }) {
    const prototype = this.getPrototype(type)
    yield* Prototype.ownDescriptors(prototype, {
      filter: (key, descriptor) => !this.isKnownKey(type, key)
        && Es6Prototype.#isTypeof(descriptor, descriptorType)
    })
  }  

  *getDescriptor(type, name, { descriptorType } = { }) {
    const prototype = this.getPrototype(type)
    yield* Prototype.getDescriptor(prototype, name, {
      filter: (host, key, descriptor) => !this.isKnownKey(host, key)
        && Es6Prototype.#isTypeof(descriptor, descriptorType)
    })
  }

  *descriptors(type, { descriptorType, includeOverridden } = { }) {
    const prototype = this.getPrototype(type)
    yield* Prototype.descriptors(prototype, {
      includeOverridden,
      filter: (host, key, descriptor) => !this.isKnownKey(host, key)
        && Es6Prototype.#isTypeof(descriptor, descriptorType)
    })
  }

  copyTo(type, target, {
    createThunk = (key, descriptor) => descriptor,
    filter = (host, key, descriptor) => true,
    onHost = (host) => { }
  }) {
    const prototype = this.getPrototype(type)
    Prototype.copyTo(prototype, target, { createThunk, onHost,
      filter: (host, key, descriptor) => !this.isKnownKey(host, key) 
        && filter(host, key, descriptor),
    })
  }

  canDuckCast(type, instance) {
    const prototype = this.getPrototype(type)
    return Prototype.canDuckCast(prototype, instance, {
      filter: (host, key, descriptor) => !this.isKnownKey(host, key),
      compare: Es6Descriptor.canDuckCast,
    })
  }

  *ownValues(type, { instance, descriptorType, instanceOf } = { }) {
    const descriptors = this.ownDescriptors(type, { descriptorType })
    yield *Es6Descriptor.values(descriptors, instance)
      .filter(this.#instanceOfFilter(instanceOf))
  }

  *getValue(type, name, { instance, descriptorType, instanceOf } = { }) {
    const descriptors = this.getDescriptor(type, name, { 
      descriptorType, includeOverridden: true })
    yield* Es6Descriptor.values(descriptors, instance)
      .filter(this.#instanceOfFilter(instanceOf))
  }

  *values(type, { 
    instance, includeOverridden, descriptorType, instanceOf } = { }) {
    const descriptors = this.descriptors(type, { 
      includeOverridden, descriptorType })
    yield *Es6Descriptor.values(descriptors, instance, { descriptorType })
      .filter(this.#instanceOfFilter(instanceOf))
  }

  *hosts(type, name) {
    for (const current of this.hierarchy(type))
      if (this.hasKey(current, name)) yield current
  }
}
