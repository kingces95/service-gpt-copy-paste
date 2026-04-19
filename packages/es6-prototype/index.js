import { assert } from '@kingjs/assert'
import { Descriptor } from '@kingjs/descriptor'
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

  static #getOwnDescriptor(prototype, name, descriptorType) {
    const descriptor = Prototype.getOwnDescriptor(prototype, name)
    if (!Es6Prototype.#isTypeof(descriptor, descriptorType)) return null
    return descriptor
  }

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
    for (const link of Prototype.chain(prototype))
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
    return Prototype.hasOwnKey(prototype, name)
  }

  hasKey(type, name) {
    if (this.isKnownKey(type, name)) return false
    const prototype = this.getPrototype(type)
    return Prototype.hasKey(prototype, name)
  }

  *ownKeys(type) {
    const prototype = this.getPrototype(type)
    for (const name of Prototype.ownKeys(prototype)) {
      if (this.isKnownKey(type, name)) continue
      yield name
    }
  }

  *keys(type, { includeOverridden = false } = { }) {
    const prototype = this.getPrototype(type)
    
    const visited = new Set()
    for (const current of Prototype.chain(prototype)) {
      const ctor = current.constructor
      yield ctor
      for (const key of Prototype.ownKeys(current)) {
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
    return Es6Prototype.#getOwnDescriptor(prototype, name, descriptorType)
  }

  *ownDescriptors(type, { descriptorType } = { }) {
    for (const key of this.ownKeys(type)) {
      const prototype = this.getPrototype(type)
      const descriptor = Es6Prototype.#getOwnDescriptor(
        prototype, key, descriptorType)
      if (!descriptor) continue

      yield key
      yield descriptor
    }
  }  

  *getDescriptor(type, name, { descriptorType } = { }) {
    const prototype = this.getPrototype(type)
    for (const current of Prototype.chain(prototype)) {  
      const ctor = current.constructor
      if (this.isKnownKey(ctor, name)) continue

      const descriptor = Es6Prototype.#getOwnDescriptor(
        current, name, descriptorType)
      if (!descriptor) continue

      yield ctor
      yield descriptor
    }
  }

  *descriptors(type, { descriptorType, includeOverridden } = { }) {
    const prototype = this.getPrototype(type)
    const visited = new Set()
    for (const current of Prototype.chain(prototype)) {
      const host = current.constructor
      yield host
      for (const key of Prototype.ownKeys(current)) {
        if (!includeOverridden && visited.has(key)) continue
        if (this.isKnownKey(host, key)) continue
        visited.add(key)

        const descriptor = Es6Prototype.#getOwnDescriptor(
          current, key, descriptorType)
        if (!descriptor) continue

        yield key
        yield descriptor
      }
    }
  }

  copyTo(type, target, {
    createThunk = (key, descriptor) => descriptor,
    predicate = (key, descriptor) => true,
    onHost = (host) => { }
  }) {
    let key
    let host
    for (const current of this.descriptors(type)) {
      assert (typeof current == 'string' 
        || typeof current == 'symbol'
        || typeof current == 'object'
        || typeof current == 'function',
        `Unexpected type: ${typeof current}`)
  
      switch (typeof current) {
        case 'string':
        case 'symbol':
          key = current
          break
        case 'object':
          const descriptor = current
          const debug = host
          if (!predicate(key, descriptor)) break
          const thunk = createThunk(key, descriptor)
          Object.defineProperty(target, key, thunk)
          break
        case 'function':
          host = current
          onHost(host)
          break
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
