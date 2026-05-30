import { assert } from '@kingjs/assert'
import { Descriptor } from '@kingjs/descriptor'
import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { instanceOf } from '@kingjs/instance-of'
import { asSet } from '@kingjs/as-set'
import { Prototype } from '@kingjs/prototype'

class Es6PrototypeCache {
  #host
  #cache
  #hint
  #getPrototype

  constructor(host, getPrototype, hint) {
    this.#host = host
    this.#hint = hint
    this.#getPrototype = getPrototype
  }

  getPrototype(type) {
    assert(type)

    if (!this.#getPrototype)
      return type.prototype

    if (!this.#cache)
      this.#cache = new WeakMap()

    let prototype = this.#cache.get(type)
    if (!prototype) {
      prototype = this.#getPrototype.call(this.#host, type)
      assert(prototype)
      if (this.#hint(type))
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
    getPrototype = null,
    cacheHint = type => true,
    splitAccessors = false,
  } = { }) {
    this.#knownTypes = new Set(knownTypes)
    this.#knownTypeFn = knownTypeFn
    this.#knownKeys = new Set(knownKeys)
    this.#knownKeyFn = knownKeyFn
    this.splitAccessors = splitAccessors
    this.#cache = new Es6PrototypeCache(this, getPrototype, cacheHint)
  }

  getPrototype(type) {
    return this.#cache.getPrototype(type)
  }

  isKnown(type) {
    if (!type) return false
    return this.#knownTypes.has(type)
      || this.#knownTypeFn?.(type) == true
  }
  isKnownKey(type, key) {
    if (this.isKnown(type)) return true
    return this.#knownKeys.has(key)
      || this.#knownKeyFn?.(type, key) == true
  }

  *hierarchy(type, { reverseHierarchy } = { }) {
    const prototype = this.getPrototype(type)
    yield* Prototype.chain(prototype, { reverseHierarchy })
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

  isComposedOf(type, targetType) {
    return this.hierarchy(type)
      .some(type => type === targetType)
  }

  hasBaseType() {}

  hasOwnKey(type, key) {
    if (this.isKnownKey(type, key)) return false
    const prototype = this.getPrototype(type)
    return Prototype.hasOwnKey(prototype, key)
  }

  hasKey(type, key) {
    if (this.isKnownKey(type, key)) return false
    const prototype = this.getPrototype(type)
    return Prototype.hasKey(prototype, key)
  }

  hasGetter(type, key, { descriptorType } = { }) {
    const descriptor = this.getDescriptor(type, key, { descriptorType })
    return Descriptor.hasGetter(descriptor)
  }

  hasSetter(type, key, { descriptorType } = { }) {
    const descriptor = this.getDescriptor(type, key, { descriptorType })
    return Descriptor.hasSetter(descriptor)
  }

  *ownKeys(type) {
    const prototype = this.getPrototype(type)
    yield *Prototype.ownKeys(prototype)
      .filter(key => !this.isKnownKey(type, key))
  }

  *keys(type, {
    includeOverridden = false,
    reverseHierarchy,
  } = { }) {
    const prototype = this.getPrototype(type)
    const { splitAccessors } = this
    yield* Prototype.keys(prototype, {
      includeOverridden,
      reverseHierarchy,
      splitAccessors,
      filter: (type, key) => !this.isKnownKey(type, key)
    })
  }

  getOwnDescriptor(type, key, { descriptorType } = { }) {
    if (!this.hasOwnKey(type, key)) return null
    const prototype = this.getPrototype(type)
    const descriptor = Prototype.getOwnDescriptor(prototype, key)
    if (!isTypeof(descriptor, descriptorType)) return null
    return descriptor
  }

  *ownDescriptors(type, { descriptorType } = { }) {
    const prototype = this.getPrototype(type)
    yield* Prototype.ownDescriptors(prototype, {
      filter: (host, key, descriptor) => !this.isKnownKey(host, key)
        && isTypeof(descriptor, descriptorType)
    })
  }

  *findDescriptors(type, key, {
    descriptorType,
    reverseHierarchy,
  } = { }) {
    const prototype = this.getPrototype(type)
    yield* Prototype.findDescriptors(prototype, key, {
      reverseHierarchy,
      filter: (host, key, descriptor) => !this.isKnownKey(host, key)
        && isTypeof(descriptor, descriptorType)
    })
  }

  getDescriptor(type, key, { descriptorType, context } = { }) {
    if (this.isKnownKey(type, key)) return null

    const prototype = this.getPrototype(type)
    const { splitAccessors } = this
    return Prototype.getDescriptor(prototype, key, {
      splitAccessors,
      context,
      filter: (host, key, descriptor) => !this.isKnownKey(host, key)
        && isTypeof(descriptor, descriptorType)
    })
  }

  *descriptors(type, {
    descriptorType,
    includeOverridden,
    reverseHierarchy,
  } = { }) {
    const prototype = this.getPrototype(type)
    const { splitAccessors } = this
    yield* Prototype.descriptors(prototype, {
      includeOverridden,
      reverseHierarchy,
      splitAccessors,
      filter: (host, key, descriptor) => !this.isKnownKey(host, key)
        && isTypeof(descriptor, descriptorType)
    })
  }

  copyTo(type, target, {
    filterOwn = false,
    includeOverridden = false,
    reverseHierarchy,
    filter = (host, key, descriptor) => true,
    map = (host, key, descriptor) => descriptor,
    createThunk = (key, descriptor) => descriptor,
    onCopy = (host, key, descriptor) => { },
    onHost = (host) => { },
    asDescriptor = false,
  }) {
    const prototype = this.getPrototype(type)
    const { splitAccessors } = this
    Prototype.copyTo(prototype, target, {
      createThunk, includeOverridden, onCopy, onHost, map, asDescriptor,
      filterOwn, reverseHierarchy, splitAccessors,
      filter: (host, key, descriptor) => !this.isKnownKey(host, key)
        && filter(host, key, descriptor),
    })
  }

  reduce(mergeOrder, {
    filterOwn = false,
    filter = (host, key, descriptor) => true,
    map = (descriptor, existing) => descriptor
  } = { }) {
    const memberTable = new Map()
    return mergeOrder.reduce((prototype, currentType) => {
      const descriptors = { }

      this.copyTo(currentType, descriptors, {
        filterOwn, filter,
        asDescriptor: true,
        map: (host, key, descriptor) =>
          map(descriptor, memberTable.get(key)),
        onCopy: (host, key, descriptor) =>
          memberTable.set(key, descriptor)
      })

      return Prototype.create(currentType, prototype, descriptors)
    }, null)
  }

  canDuckCast(type, instance) {
    let key
    let instanceDescriptor
    for (const current of this.descriptors(type)) {
      const typeofCurrent = typeof current
      assert (typeofCurrent == 'string'
        || typeofCurrent == 'symbol'
        || typeofCurrent == 'object'
        || typeofCurrent == 'function')

      switch (typeofCurrent) {
        case 'string':
        case 'symbol':
          key = current
          instanceDescriptor = Descriptor.get(instance, key)
          if (!instanceDescriptor) return false
          break

          case 'object': {
          const shapeDescriptor = current
          if (!Descriptor.formof(instanceDescriptor, instance,
            Es6Descriptor.shapeof(shapeDescriptor)))
            return false
        }
        case 'function': break
      }
    }
    return true
  }

  canStrictDuckCast(type, instance) {
    let key
    let instanceDescriptor
    for (const current of this.descriptors(type)) {
      const typeofCurrent = typeof current
      assert (typeofCurrent == 'string'
        || typeofCurrent == 'symbol'
        || typeofCurrent == 'object'
        || typeofCurrent == 'function')

      switch (typeofCurrent) {
        case 'string':
        case 'symbol':
          key = current
          instanceDescriptor = Descriptor.get(instance, key)
          if (!instanceDescriptor) return false
          break

          case 'object': {
          const shapeDescriptor = current
          if (!Es6Descriptor.formof(instanceDescriptor,
            Es6Descriptor.shapeof(shapeDescriptor)))
            return false
        }
        case 'function': break
      }
    }
    return true
  }

  *ownValues(type, { instance, descriptorType, instanceOf } = { }) {
    const prototype = this.getPrototype(type)
    yield* Prototype.ownValues(prototype, { instance, descriptorType,
      filter: (host, key, descriptor) => !this.isKnownKey(host, key)
        && isTypeof(descriptor, descriptorType)
    }).map(result => Es6Descriptor.promoteValue(result, instance))
        .filter(instanceOfFilter(instanceOf))
  }

  *findValues(type, key, {
    instance, descriptorType, instanceOf, reverseHierarchy
  } = { }) {
    const prototype = this.getPrototype(type)
    yield* Prototype.findValues(prototype, key, {
      instance,
      reverseHierarchy,
      filter: (host, key, descriptor) => !this.isKnownKey(host, key)
        && isTypeof(descriptor, descriptorType)
    }).map(result => Es6Descriptor.promoteValue(result, instance))
        .filter(instanceOfFilter(instanceOf))
  }

  getValue(type, key, {
    instance, descriptorType, instanceOf, context } = { }) {
    if (this.isKnownKey(type, key)) return null

    const { descriptor, host } = this.getDescriptor(type, key, {
      descriptorType,
      context: true,
    })
      || { }
    if (!descriptor)
      return null

    const result = Descriptor.getValue(descriptor, instance)
    result.host = host
    Es6Descriptor.promoteValue(result, instance)
    if (!instanceOfFilter(instanceOf)(result))
      return null

    const { value, type: valueType, host: resultHost } = result
    return context ? { value, type: valueType, host: resultHost } : value
  }

  *values(type, {
    instance, includeOverridden, descriptorType, instanceOf,
    reverseHierarchy,
  } = { }) {
    const prototype = this.getPrototype(type)
    const { splitAccessors } = this
    yield* Prototype.values(prototype, { instance, includeOverridden,
      reverseHierarchy, splitAccessors,
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
