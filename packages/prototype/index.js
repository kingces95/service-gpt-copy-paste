import { assert } from '@kingjs/assert'
import { Descriptor } from '@kingjs/descriptor'

export class Prototype {

  static *deconstruct(prototype) {
    yield *Prototype.chain(prototype).map(link => {
      const result = Object.create(null)
      Object.defineProperties(result,
        Object.getOwnPropertyDescriptors(link))
      return result
    })
  }

  static reduce(links) {
    // links like { type, descriptors }, subtype first
    return [...links].reverse().reduce((prototype, { type, descriptors }) => {
      prototype = Prototype.create(type, prototype, descriptors)
      return prototype
    }, null)
  }

  static create(type, basePrototype = null, descriptors = { }) {
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

  static *chain(prototype, { reverseHierarchy } = { }) {
    if (reverseHierarchy) {
      const chain = []
      do chain.push(prototype)
      while (prototype = Object.getPrototypeOf(prototype))

      yield* chain.reverse()
      return
    }

    do { yield prototype }
    while (prototype = Object.getPrototypeOf(prototype))
  }

  static hasOwnKey(prototype, key) {
    return Object.prototype.hasOwnProperty.call(prototype, key)
  }

  static hasKey(prototype, key) {
    return key in prototype
  }

  static hasGetter(prototype, key, options) {
    const descriptor = Prototype.getDescriptor(prototype, key, options)
    return Descriptor.hasGetter(descriptor)
  }

  static hasSetter(prototype, key, options) {
    const descriptor = Prototype.getDescriptor(prototype, key, options)
    return Descriptor.hasSetter(descriptor)
  }

  static *ownKeys(prototype) {
    yield* Reflect.ownKeys(prototype)
  }

  static *keys(prototype, {
    includeOverridden = false,
    reverseHierarchy,
    splitAccessors = false,
    filter = (host, key) => true,
  } = { }) {
    yield* Prototype.descriptors(prototype, {
      includeOverridden,
      reverseHierarchy,
      splitAccessors,
      filter: (host, key, descriptor) => filter(host, key),
    }).filter(current => typeof current != 'object')
  }

  static getOwnDescriptor(prototype, key) {
    return Object.getOwnPropertyDescriptor(prototype, key)
  }

  static getDescriptor(prototype, key, {
    splitAccessors, context, filter } = { }) {
    const result = getResolvedDescriptor(prototype, key, {
      splitAccessors, filter })
    if (!result) return null

    return context ? result : result.descriptor
  }

  static *ownDescriptors(prototype, {
    map = (host, key, descriptor) => descriptor,
    filter = (host, key, descriptor) => true,
  } = { }) {
    const host = prototype.constructor
    for (const key of this.ownKeys(prototype)) {
      const descriptor = getOwnDescriptor(prototype, key, { map, filter, host })
      if (!descriptor) continue

      yield key
      yield descriptor
    }
  }

  static *findDescriptors(prototype, key, {
    reverseHierarchy,
    map = (host, key, descriptor) => descriptor,
    filter = (host, key, descriptor) => true,
  } = { }) {
    for (const current of Prototype.chain(prototype, { reverseHierarchy })) {
      const host = current.constructor
      const descriptor = getOwnDescriptor(current, key, { map, filter, host })
      if (!descriptor) continue

      yield host
      yield descriptor
    }
  }

  static *descriptors(prototype, {
    includeOverridden = false,
    reverseHierarchy,
    splitAccessors = false,
    map = (host, key, descriptor) => descriptor,
    filter = (host, key, descriptor) => true,
  } = { }) {
    assert(!reverseHierarchy || includeOverridden,
      'reverseHierarchy requires includeOverridden.')

    // splitAccessors only affects override suppression.
    if (includeOverridden)
      splitAccessors = false

    const visited = splitAccessors ? new Map() : new Set()
    for (const current of Prototype.chain(prototype, { reverseHierarchy })) {
      const host = current.constructor
      yield host
      for (const key of Prototype.ownKeys(current)) {
        if (!includeOverridden && !splitAccessors && visited.has(key))
          continue

        let descriptor = getOwnDescriptor(current, key, { map, filter, host })
        if (!descriptor) continue

        if (splitAccessors) {
          assert(!includeOverridden)
          const covered = visited.get(key)
          descriptor = Descriptor.subtractSlots(descriptor, covered)
          if (!descriptor) continue

          visited.set(key, Descriptor.mergeAccessors(
            covered, descriptor))
        }
        else {
          visited.add(key)
        }

        yield key
        yield descriptor
      }
    }
  }

  static copyTo(prototype, target, {
    onCopy = (host, key, descriptor) => { },
    onHost = (host) => { },
    map = (host, key, descriptor) => descriptor,
    filter = (host, key, descriptor) => true,
    filterOwn = false,
    includeOverridden = false,
    reverseHierarchy,
    splitAccessors = false,
    createThunk = (key, descriptor) => descriptor,
    asDescriptor = false,
  }) {
    let key
    let host
    const fn = filterOwn ? this.ownDescriptors : this.descriptors
    for (const current of fn.call(this, prototype, {
      includeOverridden,
      splitAccessors,
      map,
      filter,
      reverseHierarchy,
    })) {
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
          const thunk = createThunk(key, descriptor, host)
          const existing = Descriptor.get(target, key)
          const merged = splitAccessors
            ? Descriptor.mergeAccessors(existing, thunk)
            : thunk
          if (asDescriptor) target[key] = merged
            else Object.defineProperty(target, key, merged)
          onCopy(host, key, descriptor)
          break
        case 'function':
          host = current
          onHost(host)
          break
      }
    }
  }

  static *ownValues(prototype, { instance, filter } = { }) {
    const descriptors = Prototype.ownDescriptors(prototype, { filter })
    yield *values(descriptors, instance)
  }

  static getValue(prototype, key, {
    instance, splitAccessors, context, filter } = { }) {
    const { descriptor, host } = Prototype.getDescriptor(prototype, key, {
      splitAccessors, filter, context: true,
    }) || { }
    if (!descriptor || !isReadableDescriptor(descriptor))
      return null

    const { value, type } = Descriptor.getValue(descriptor, instance)
    return context ? { value, type, host } : value
  }

  static *findValues(prototype, key, {
    instance, reverseHierarchy, filter } = { }) {
    const descriptors = Prototype.findDescriptors(prototype, key, {
      filter, reverseHierarchy })
    yield* values(descriptors, instance)
  }

  static *values(prototype, {
    instance, includeOverridden, reverseHierarchy, splitAccessors, filter } = { }) {
    const descriptors = Prototype.descriptors(prototype, { filter,
      includeOverridden, reverseHierarchy, splitAccessors })
    yield *values(descriptors, instance)
  }
}

function getResolvedDescriptor(prototype, key, {
  splitAccessors, filter = (host, key, descriptor) => true } = { }) {
  let host
  let descriptor
  let descriptorHost

  for (const current of Prototype.descriptors(prototype, {
    splitAccessors,
    filter: (host, currentKey, descriptor) => currentKey === key
      && filter(host, currentKey, descriptor),
  })) {
    switch (typeof current) {
      case 'function':
        host = current
        break

      case 'string':
      case 'symbol':
        break

      case 'object': {
        descriptor = splitAccessors
          ? Descriptor.mergeAccessors(descriptor, current)
          : current
        descriptorHost ??= host

        if (!splitAccessors)
          return { host: descriptorHost, descriptor }

        break
      }

      default:
        assert(false, `Unexpected type: ${typeof current}`)
    }
  }

  if (descriptor)
    return { host: descriptorHost, descriptor }

  return null
}

function *values(descriptors, instance) {
  let key
  let host
  for (const current of descriptors) {
    assert(typeof current == 'object'
      || typeof current == 'function'
      || typeof current == 'string'
      || typeof current == 'symbol')

    switch (typeof current) {
      case 'function':
        host = current
        break

      case 'string':
      case 'symbol':
        key = current
        break

      case 'object': {
        const descriptor = current
        if (!isReadableDescriptor(descriptor))
          break

        const result = Descriptor.getValue(descriptor, instance)
        if (key) result.key = key
        if (host) result.host = host
        yield result
        break
      }
    }
  }
}

function isReadableDescriptor(descriptor) {
  return Descriptor.hasValue(descriptor) || Descriptor.hasGetter(descriptor)
}

// TODO: change lambda order to key, descriptor, host for better currying
function getOwnDescriptor(prototype, key, { map, filter, host }) {
  let descriptor = Prototype.getOwnDescriptor(prototype, key)
  if (!descriptor)
    return null

  if (!filter(host, key, descriptor))
    return null

  descriptor = map(host, key, descriptor)
  if (!descriptor)
    return null

  return descriptor
}
