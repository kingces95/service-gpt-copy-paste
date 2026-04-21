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

  static *keys(prototype, { 
    includeOverridden = false,
    filter = (host, key) => true,
  } = { }) {
    const visited = new Set()
    for (const current of Prototype.chain(prototype)) {
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

  static *ownDescriptors(prototype, { 
    map = (key, descriptor) => descriptor,
    filter = (key, descriptor) => true,
  } = { }) {
    for (const key of this.ownKeys(prototype)) {
      const descriptor = getOwnDescriptor(prototype, key, { map, filter })
      if (!descriptor) continue

      yield key
      yield descriptor
    }
  }  

  static *getDescriptor(prototype, key, { 
    map = (host, key, descriptor) => descriptor,
    filter = (host, key, descriptor) => true,
  } = { }) {
    for (const current of Prototype.chain(prototype)) {
      const host = current.constructor
      const descriptor = getOwnDescriptor(current, key, { map, filter, host })
      if (!descriptor) continue

      yield host
      yield descriptor
    }
  }

  static *descriptors(prototype, { 
    includeOverridden,
    map = (host, key, descriptor) => descriptor,
    filter = (host, key, descriptor) => true, 
  } = { }) {
    const visited = new Set()
    for (const current of Prototype.chain(prototype)) {
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
    onHost = (host) => { },
    map = (host, key, descriptor) => descriptor,
    filter = (host, key, descriptor) => true,
    createThunk = (key, descriptor) => descriptor,
    asDescriptor = false,
  }) {
    let key
    let host
    for (const current of this.descriptors(prototype, { map, filter })) {
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
          const thunk = createThunk(key, descriptor)
          if (asDescriptor) target[key] = thunk
            else Object.defineProperty(target, key, thunk)
          break
        case 'function':
          host = current
          onHost(host)
          break
      }
    }
  }

  static canDuckCast(prototype, instance, { 
    filter = (host, key, descriptor) => true,
    compare = Descriptor.canDuctCast,
  } = { }) {
    let name
    let actualDescriptor
    for (const current of this.descriptors(prototype, { filter })) {
      const typeofCurrent = typeof current
      assert (typeofCurrent == 'string'
        || typeofCurrent == 'symbol'
        || typeofCurrent == 'object'
        || typeofCurrent == 'function')

      switch (typeofCurrent) {
        case 'string': 
        case 'symbol': 
          name = current
          if (!(name in instance)) return false 
          actualDescriptor = Descriptor.get(instance, name)
          break
          
          case 'object': {
          const expectedDescriptor = current
          if (!compare(expectedDescriptor, actualDescriptor))
            return false
        }
        case 'function': break
      }
    }
    return true
  }

  static *ownValues(prototype, { instance, filter } = { }) {
    const descriptors = Prototype.ownDescriptors(prototype, { filter })
    yield *Descriptor.values(descriptors, instance)
  }

  static *getValue(prototype, name, { instance, filter } = { }) {
    const descriptors = Prototype.getDescriptor(prototype, name, { filter, 
      includeOverridden: true })
    yield* Descriptor.values(descriptors, instance)
  }

  static *values(prototype, { 
    instance, includeOverridden, filter } = { }) {
    const descriptors = Prototype.descriptors(prototype, { filter,
      includeOverridden })
    yield *Descriptor.values(descriptors, instance)
  }
}

// TODO: change lambda order to key, descriptor, host for better currying
function getOwnDescriptor(prototype, key, { map, filter, host }) {
  let descriptor = Prototype.getOwnDescriptor(prototype, key)
  if (!descriptor) return null
  const args = [key]; if (host) args.unshift(host)
  descriptor = map(...args, descriptor)
  if (!descriptor) return null
  if (!filter(...args, descriptor)) return null
  return descriptor
}