import assert from 'assert'
import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { es6Typeof } from '@kingjs/es6-typeof'

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

  static *ownKeys(prototype) {
    yield* Reflect.ownKeys(prototype)
  }

  static getOwnDescriptor(prototype, name) {
    return Object.getOwnPropertyDescriptor(prototype, name)
  }

  // Algorithms for querying a prototype chain. Other type systems use
  // the same algorithms by carful construction of their own prototype
  // chains. 

  // For each of the following examples, the constructed prototype chain 
  // each link  has its descriptors copied from an original object and 
  // a next link that is custom to the construction. For this reason, 
  // the constructed prototype chain does not round trip via 
  // .constructor.prototype. This is a key assumption that allows for the 
  // flexibility of the examples. Consequently, .baseType is the one 
  // notable omission from Es6Reflector.

  // == Static members ==
  // For example, static members are typically queryied by walking
  // the ctor chain, but since the ctor chain is not homogeneous, this
  // complicates callers who would have to distinguish between ctors and
  // non-ctors in the chain. This is due to the fact that eventually all 
  // ctor chains terminate in Function.prototype which has as its prototype 
  // Object.prototype. Instead a custom protoype chain is constructed where:
  // - No links are ctor by definition of a prototype chain.
  // - All links have a .constructor property that is the type of interest.
  //   (And .constructor becomes a reserved work for static members.)
  // - The final link can be constructed, given the following, to be:
  //    - class { }, Object with no members of interest
  //    - class extends Object { }, Object with members of interest
  //    - class extends null { }, not Object at all
  // This implies that there exists a prototype link with a .constructor of 
  // Object that has different members -- one with and one without. A bit
  // odd but *less* odd then the actual JavaScript ctor chain.

  // == Multiple inheritance ==
  // For another example, a type system that supports multipule inheritance
  // can construct a prototype chain that includes all base types in an 
  // order consistent with the method resolution order of the type system
  // (typically reverse post-order depth first traversal). Somewhat
  // surprisingly (!), this prototype chain construction allows for querying 
  // a multipule inheritance hierarchy using the same algorithms as a single 
  // inheritance hierarchy. 

  #getPrototypeFn
  #knownTypes
  #knownKeys

  constructor({
    getPrototypeFn = type => type.prototype,
    knownTypes = [],
    knownKeys = [],
  } = { }) {
    this.#getPrototypeFn = getPrototypeFn
    this.#knownTypes = new Set(knownTypes)
    this.#knownKeys = new Set(knownKeys)
  }

  getPrototype(type) {
    return this.#getPrototypeFn(type)
  }

  *hierarchy(type) {
    const prototype = this.#getPrototypeFn(type)
    for (const link of Es6Prototype.chain(prototype))
      yield link.constructor
  }
  
  *hierarchy$(type) {
    const prototype = this.#getPrototypeFn(type)
    for (const link of Es6Prototype.chain(prototype)) {
      yield link.constructor
      yield link
    }
  }


  isKnown(type) {
    return this.#knownTypes.has(type)
  }
  isKnownKey(type, name) {
    if (this.isKnown(type)) return true
    return this.#knownKeys.has(name)
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

  isExtensionOf(type, targetType) {
    for (const base of this.baseTypes(type))
      if (base == targetType) return true
    return false
  }

  isAbstract(type) {
    return type != Object && !this.isExtensionOf(type, Object)
  }

  hasOwnKey(type, name) {
    if (this.isKnownKey(type, name)) return false
    const prototype = this.#getPrototypeFn(type)
    return Es6Prototype.hasOwnKey(prototype, name)
  }

  *ownKeys(type) {
    const prototype = this.#getPrototypeFn(type)
    for (const name of Es6Prototype.ownKeys(prototype)) {
      if (this.isKnownKey(type, name)) continue
      yield name
    }
  }

  *keys(type, { includeOverridden = false } = { }) {
    const prototype = this.#getPrototypeFn(type)
    
    const visited = new Set()
    for (const current of Es6Prototype.chain(prototype)) {
      const ctor = current.constructor
      yield ctor
      for (const key of Es6Prototype.ownKeys(current)) {
        if (visited.has(key)) continue
        if (!includeOverridden && this.isKnownKey(ctor, key)) 
          continue
        visited.add(key)
        yield key
      }
    }
  }

  isHostOf(type, name) {
    if (this.isKnownKey(type, name)) return false
    const prototype = this.#getPrototypeFn(type)
    return name in prototype
  }

  *getHosts(type, name) {
    for (const current of this.hierarchy(type))
      if (this.isHostOf(current, name)) yield current
  }

  getImplementingHost(type, name) {
    for (const current of this.hierarchy(type))
      if (this.hasOwnKey(current, name)) return current
    return null
  }

  getOwnDescriptor(type, name) {
    if (!this.hasOwnKey(type, name)) return null
    const prototype = this.#getPrototypeFn(type)
    return Es6Prototype.getOwnDescriptor(prototype, name)
  }

  *ownDescriptors(type) {
    for (const key of this.ownKeys(type)) {
      yield key
      yield this.getOwnDescriptor(type, key)
    }
  }  

  *getDescriptor(type, name) {
    const prototype = this.#getPrototypeFn(type)
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
}

export class Es6InstancePrototype extends Es6Prototype {
  constructor({
    knownKeys = [],
    knownTypes = [], 
    getPrototypeFn = type => type.prototype,
  }) {
    super({
      getPrototypeFn,
      knownTypes,
      knownKeys,
    })
  }

  typeof(type, key, descriptor) {
    const descriptorType = Es6Descriptor.typeof(descriptor)
    if (descriptorType != 'field')
      return descriptorType

    const value = descriptor.value
    const es6Type = es6Typeof(value)
    if (key === 'constructor' && value === type) {
      assert(es6Type == 'class')
      return 'constructor'
    }

    return 'field'
  }
}

export class Es6PrototypeCache {
  #cache
  #getPrototype

  constructor(getPrototype) {
    this.#cache = new WeakMap()
    this.#getPrototype = getPrototype
  }

  getPrototype(type) {
    if (!type) return null

    let prototype = this.#cache.get(type)
    if (!prototype) {
      prototype = this.#getPrototype(type)
      this.#cache.set(type, prototype)
    }
    return prototype
  }
}

export class Es6StaticPrototype extends Es6Prototype {
  static #cache

  static {
    const objectNullPrototype = Es6Prototype.createLink(Object)
    const objectPrototype = Es6Prototype.createLink(
      Object, null, Object.getOwnPropertyDescriptors(Object))

    const cache = new Es6PrototypeCache(type => {
      // base case: class { } or class extends null { }
      if (type == Function.prototype) 
        return objectNullPrototype

      // base case: class extends Object { }
      if (type == Object) 
        return objectPrototype

      // recursive case: class extends Base { }
      const baseType = Object.getPrototypeOf(type)
      const basePrototype = cache.getPrototype(baseType)
      const descriptors = Object.getOwnPropertyDescriptors(type)
      return Es6Prototype.createLink(type, basePrototype, descriptors)
    })

    Es6StaticPrototype.#cache = cache
  }

  static getPrototype(type) { return this.#cache.getPrototype(type) }

  constructor({
    knownKeys = [],
    knownTypes = [],
  }) {
    // .constructor is reserved for static members since it is needed
    // to construct the prototype chain.
    knownKeys.push('constructor')

    super({
      getPrototypeFn: type => Es6StaticPrototype.getPrototype(type),
      knownTypes,
      knownKeys,
    })
  }

  typeof(type, key, descriptor) {
    return Es6Descriptor.typeof(descriptor)
  }
}
