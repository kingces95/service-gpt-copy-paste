import { assert } from '@kingjs/assert'
import { Descriptor } from '@kingjs/descriptor'


class Es6PrototypeCache {
  #cache
  #getPrototype

  constructor(getPrototype) {
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
      prototype = this.#getPrototype(type)
      this.#cache.set(type, prototype)
    }
    return prototype
  }
}

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

  static hasKey(prototype, name) {
    return name in prototype
  }

  static *ownKeys(prototype) {
    yield* Reflect.ownKeys(prototype)
  }

  static getOwnDescriptor(prototype, name) {
    return Object.getOwnPropertyDescriptor(prototype, name)
  }

  #cache
  #knownTypes
  #knownKeys

  constructor({
    getPrototypeFn = null,
    knownTypes = [],
    knownKeys = [],
  } = { }) {
    this.#knownTypes = new Set(knownTypes)
    this.#knownKeys = new Set(knownKeys)
    this.#cache = new Es6PrototypeCache(getPrototypeFn)
  }

  getPrototype(type) {
    return this.#cache.getPrototype(type)
  }

  *hierarchy(type) {
    const prototype = this.getPrototype(type)
    for (const link of Es6Prototype.chain(prototype))
      yield link.constructor
  }
  
  *hierarchy$(type) {
    const prototype = this.getPrototype(type)
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

  *ownHosts(type, name) {
    for (const current of this.hierarchy(type))
      if (this.hasOwnKey(current, name)) yield current
  }

  *hosts(type, name) {
    for (const current of this.hierarchy(type))
      if (this.hasKey(current, name)) yield current
  }

  getImplementingHost(type, name) {
    for (const current of this.hierarchy(type))
      if (this.hasOwnKey(current, name)) return current
    return null
  }

  getOwnDescriptor(type, name) {
    if (!this.hasOwnKey(type, name)) return null
    const prototype = this.getPrototype(type)
    return Es6Prototype.getOwnDescriptor(prototype, name)
  }

  *ownDescriptors(type) {
    for (const key of this.ownKeys(type)) {
      yield key
      yield this.getOwnDescriptor(type, key)
    }
  }  

  *getDescriptor(type, name) {
    const prototype = this.getPrototype(type)
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

const ObjectCtorWithStatics = Es6Prototype.createLink(
      Object, null, Object.getOwnPropertyDescriptors(Object))
const ObjectCtorWithoutStatics = Es6Prototype.createLink(Object)

export class Es6StaticPrototype extends Es6Prototype {
  // Transform ES6 static prototype chain as below.

  // These constructions allow for the same algorithms used to query 
  // the instance prototype chain to be used to query the static
  // prototype chain. For example,
  
  //    .keys() and .descriptors() return just the static members. 
  //    The insance members found on Function.prototype and 
  //    Object.prototype are excluded because they are not included 
  //    in the chain.

  //    .baseTypes() and .hierarchy() return the same list of types as 
  //    would be returned by the instance prototype chain. This unifies
  //    the static and instance prototype chains.

  // Note the chain link labeled Object and Object* both have a 
  // .constructor pointing to the ES6 Object function, but only 
  // Object* has a copy of the static members of Object. The Object 
  // link has no members. 
  
  // The one gotcha is Object* is never directly returned as a prototype of
  // any type, but is only used as a link in the prototype chain when a 
  // type extends Object. This is a bit odd but less odd than the actual
  // JavaScript ctor chain. This is mitigated by higher level Reflectors 
  // that only return user defined members in which case all members of 
  // Object are hidden anyway.

  // The other small gotcha is that, unlike ES6, .constructor is reserved 
  // as a *static* member. A small price to pay!

  // class A { }

  // ES6 Chains:                        Static Prototype Chain:
  // A                                  A
  // └── Function.prototype       ->    └── Object
  //     └── Object.prototype               └── null
  //         └── null                                                                                                                              
  //                                                                                                      
  // A.prototype                                                                                                  
  // └── Object.prototype                                                                                           
  //     └── null                                                                                   
 
  // class A extends null

  // ES6 Chains:                        Static Prototype Chain:
  // A                                  A
  // └── Function.prototype       ->    └── null
  //     └── Object.prototype               
  //         └── null     
  //                                                                                                      
  // A.prototype                                                                                                  
  // └── null                                                                                   

  // class A extends Object { }                                                                             

  // ES6 Class:                         Static Prototype Chain:
  // A                                  A 
  // └── Object                   ->    └── Object*
  //     └── Function.prototype             └── null
  //         └── Object.prototype           
  //             └── null  
  //                                                                                                      
  // A.prototype                                                                                                  
  // └── Object.prototype                                                                                           
  //     └── null 

  constructor({
    knownKeys = [],
    knownTypes = [],
  }) {
    // .constructor is reserved for static members since it is needed
    // to construct the prototype chain.
    knownKeys.push('constructor')

    super({
      getPrototypeFn: type => {
        // base case: class { }
        if (type == Function.prototype) 
          return ObjectCtorWithoutStatics

        // base case: class extends Object { }
        if (type == Object) 
          return ObjectCtorWithStatics

        const baseType = Object.getPrototypeOf(type)
        const basePrototype = 
          // base case: class extends null { }
          baseType == Function.prototype 
            && Object.getPrototypeOf(type.prototype) == null ? null

          // recursive case: class extends Base { }
          : this.getPrototype(baseType)

        const descriptors = Object.getOwnPropertyDescriptors(type)
        return Es6Prototype.createLink(type, basePrototype, descriptors)
      },
      knownTypes,
      knownKeys,
    })
  }
}
