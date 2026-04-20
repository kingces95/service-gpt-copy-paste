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
    if (!isTypeof(descriptor, descriptorType)) return null
    return descriptor
  }

  *ownDescriptors(type, { descriptorType } = { }) {
    const prototype = this.getPrototype(type)
    yield* Prototype.ownDescriptors(prototype, {
      filter: (key, descriptor) => !this.isKnownKey(type, key)
        && isTypeof(descriptor, descriptorType)
    })
  }  

  *getDescriptor(type, name, { descriptorType } = { }) {
    const prototype = this.getPrototype(type)
    yield* Prototype.getDescriptor(prototype, name, {
      filter: (host, key, descriptor) => !this.isKnownKey(host, key)
        && isTypeof(descriptor, descriptorType)
    })
  }

  *descriptors(type, { descriptorType, includeOverridden } = { }) {
    const prototype = this.getPrototype(type)
    yield* Prototype.descriptors(prototype, {
      includeOverridden,
      filter: (host, key, descriptor) => !this.isKnownKey(host, key)
        && isTypeof(descriptor, descriptorType)
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
    const prototype = this.getPrototype(type)
    yield* Prototype.ownValues(prototype, { instance, descriptorType,
      filter: (key, descriptor) => !this.isKnownKey(type, key)
        && isTypeof(descriptor, descriptorType)
    }).map(result => Es6Descriptor.promoteValue(result, instance))
        .filter(instanceOfFilter(instanceOf))
  }

  *getValue(type, name, { instance, descriptorType, instanceOf } = { }) {
    const prototype = this.getPrototype(type)
    yield* Prototype.getValue(prototype, name, { instance, descriptorType,
      filter: (host, key, descriptor) => !this.isKnownKey(host, key)
        && isTypeof(descriptor, descriptorType) 
    }).map(result => Es6Descriptor.promoteValue(result, instance))
        .filter(instanceOfFilter(instanceOf))
  }

  *values(type, { 
    instance, includeOverridden, descriptorType, instanceOf } = { }) {
    const prototype = this.getPrototype(type)
    yield* Prototype.values(prototype, { instance, includeOverridden,
      filter: (host, key, descriptor) => !this.isKnownKey(host, key)
        && isTypeof(descriptor, descriptorType) 
    }).map(result => Es6Descriptor.promoteValue(result, instance))
        .filter(instanceOfFilter(instanceOf))
  }
}

function isTypeof(descriptor, descriptorType) {
  if (!descriptor) return false

  if (descriptorType) {
    descriptorType = asSet(descriptorType)
    if (!descriptorType.has(Es6Descriptor.typeof(descriptor))) 
      return false
  }

  return true
}

function instanceOfFilter(type) {
  return type 
    ? ({ value }) => instanceOf(value, type)
    : () => true
}