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

  static *ownKeys(prototype) {
    yield* Reflect.ownKeys(prototype)
  }

  static *keys(prototype, { 
    includeOverridden = false,
    reverseHierarchy,
    filter = (host, key) => true,
  } = { }) {
    assert(!reverseHierarchy || includeOverridden,
      'reverseHierarchy requires includeOverridden.')

    const visited = new Set()
    for (const current of Prototype.chain(prototype, { reverseHierarchy })) {
      const host = current.constructor
      yield host
      for (const key of Prototype.ownKeys(current)) {
        if (!includeOverridden && visited.has(key)) continue
        if (!filter(host, key)) continue
        visited.add(key)
        yield key
      }
    }
  }

  static getOwnDescriptor(prototype, key) {
    return Object.getOwnPropertyDescriptor(prototype, key)
  }

  static findDescriptor(prototype, key, { context } = { }) {
    const result = findFirstDescriptor(prototype, key)
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
    map = (host, key, descriptor) => descriptor,
    filter = (host, key, descriptor) => true, 
  } = { }) {
    assert(!reverseHierarchy || includeOverridden,
      'reverseHierarchy requires includeOverridden.')

    const visited = new Set()
    for (const current of Prototype.chain(prototype, { reverseHierarchy })) {
      const host = current.constructor
      yield host
      for (const key of Prototype.ownKeys(current)) {
        if (!includeOverridden && visited.has(key)) continue
        const descriptor = getOwnDescriptor(current, key, { map, filter, host })
        if (!descriptor) continue

        visited.add(key)
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
    createThunk = (key, descriptor) => descriptor,
    asDescriptor = false,
  }) {
    let key
    let host
    const fn = filterOwn ? this.ownDescriptors : this.descriptors
    for (const current of fn.call(this, prototype, {
      includeOverridden,
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
          const existing = Descriptor.get(target, key)
          const thunk = Descriptor.merge(
            existing, createThunk(key, descriptor, host))
          if (asDescriptor) target[key] = thunk
            else Object.defineProperty(target, key, thunk)
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

  static findValue(prototype, key, { instance, context } = { }) {
    const { descriptor, host } = findFirstDescriptor(prototype, key) || { }
    if (!descriptor) return null

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
    instance, includeOverridden, reverseHierarchy, filter } = { }) {
    const descriptors = Prototype.descriptors(prototype, { filter,
      includeOverridden, reverseHierarchy })
    yield *values(descriptors, instance)
  }
}

function findFirstDescriptor(prototype, key) {
  let host

  for (const current of Prototype.findDescriptors(prototype, key)) {
    switch (typeof current) {
      case 'function':
        host = current
        break

      case 'object':
        return { host, descriptor: current }

      default:
        assert(false, `Unexpected type: ${typeof current}`)
    }
  }

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
        const result = Descriptor.getValue(descriptor, instance)
        if (key) result.key = key
        if (host) result.host = host
        yield result
        break
      }
    }
  }
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
