import { assert } from '@kingjs/assert'
import { UserReflect } from '@kingjs/user-reflect'
import { ExtensionsReflect } from '@kingjs/extensions'
import { 
  PartialType, 
  PartialTypeReflect,
  Prototype,
  Constructors
} from '@kingjs/partial-type'
import { getOwn } from '@kingjs/get-own'
import { asIterable } from '@kingjs/as-iterable'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { PartialAssociate } from '@kingjs/partial-associate'

import { isAbstract } from '@kingjs/abstract'

function createPrototype(base = null) {
  const prototype = { }
  Object.setPrototypeOf(prototype, base)

  delete prototype.constructor

  const partialTypes = new Set()
  Object.defineProperty(prototype, Constructors, {
    value: partialTypes,
    configurable: true,
    enumerable: false,
    writable: true,
  })

  return prototype
}

const UrPrototype = createPrototype()

// Operations supporting @kingjs/extend.

function isExtensionOfAny(type, expectedType) {
  if (!expectedType) return true
  
  const expectedTypes = [...asIterable(expectedType)]
  if (!expectedTypes.length) return true

  for (const expectedType of expectedTypes)
    if (Es6Reflect.isExtensionOf(type, expectedType))
      return true
  return false
}

export class PartialLoader {

  static load(pojoOrType) {
    // TODO: move the POJO check from define to here
    const type = ExtensionsReflect.define(pojoOrType)
    assert(PartialTypeReflect.isPartialType(type))
    return type
  }

  static transparent(type) {
    return ExtensionsReflect.isExtensions(type)
  }

  static *ownPartialTypes(type) {
    assert(PartialTypeReflect.isPartialType(type))
    // added by declaration (e.g. by static [Extends] = PartialType)
    yield* PartialLoader.declaredOwnPartialTypes$(type)

    // added procedurally (e.g by extend() or implement())
    yield* PartialAssociate.ownPartialTypes(type)

    // added by inheritance (e.g. by extending a partial type)
    yield* PartialLoader.inheritedPartialTypes$(type)
  }
  static *declaredOwnPartialTypes$(type, symbols = PartialType.Declarations) {

    // if symbols typeof symbol, pull metadata off of type
    if (typeof symbols == 'symbol') symbols = type[symbols]
    assert(symbols != null, 'failed to find metadata symbols on type.')
    
    // symbols like { [TheSymbol]: { expectedType, map } }
    for (const symbol of Object.getOwnPropertySymbols(symbols)) {
      const options = symbols[symbol]
      const { expectedType, map = o => o } = options
      const associatedTypes = getOwn(type, symbol)

      // TODO: see RangeConcept: Breaks trying to make iterable.
      for (let associatedType of asIterable(associatedTypes).map(map)) {
        assert(isExtensionOfAny(associatedType, expectedType),
          `Associate type "${associatedType.name}" is of an unexpected type.`)
        yield associatedType
      }
    }
  }
  static *inheritedPartialTypes$(type) {
    const baseType = PartialTypeReflect.baseType(type)
    if (!baseType) return
    yield* PartialLoader.inheritedPartialTypes$(baseType)
    yield baseType
  }

  static getOwnDescriptor(type, key) {
    assert(PartialTypeReflect.isPartialType(type))
    const descriptor = UserReflect.getOwnDescriptor(type, key)
    if (!descriptor) return null
    return type[PartialType.Compile](descriptor) 
  }
  static *ownDescriptors(type) {
    assert(PartialTypeReflect.isPartialType(type))
    for (const key of UserReflect.ownKeys(type)) {
      const descriptor = PartialLoader.getOwnDescriptor(type, key)
      yield key
      yield descriptor
    }
  }

  static getPlan(rootPartialType) {
    const plan = []
    const visited = new Set()

    assert(!PartialTypeReflect.isKnown(rootPartialType))

    function reverseDepthFirstWalk$(partialType, hostOfPartialType) {
      assert(PartialTypeReflect.isPartialType(partialType))    
        
      if (visited.has(partialType)) return new Set()
        visited.add(partialType)
      
      const keys = new Set()
      const descriptors = new Map()
      const transparent = PartialLoader.transparent(partialType)
      const host = transparent ? hostOfPartialType : partialType
      const descriptors$ = class extends null { }
      const step = { 
        host,
        keys,
        transparent,
        descriptors,
        descriptors$,
      }

      plan.push(step)

      const ownPartialTypes = [...PartialLoader.ownPartialTypes(partialType)]
      for (const basePartialType of ownPartialTypes.reverse()) {
        for (const key of reverseDepthFirstWalk$(basePartialType, partialType))
          keys.add(key)
      }

      let ownKey
      for (const current of PartialLoader.ownDescriptors(partialType)) {
        switch (typeof current) {
          case 'string':
          case 'symbol': 
            ownKey = current
            keys.add(ownKey)
            break
          case 'object':
            const descriptor = current
            descriptors.set(ownKey, descriptor)
            descriptors$[ownKey] = descriptor
            break
          default: assert(false, `Unexpected type: ${typeof current}`)
        }
      }

      return keys
    }

    reverseDepthFirstWalk$(rootPartialType, null)
    return plan.reverse()
  }

  static #prototypeCache = new WeakMap()

  static getPrototype(type) {
    assert(PartialTypeReflect.isPartialType(type))

    let prototype = PartialLoader.#prototypeCache.get(type)
    if (!prototype) {
      prototype = PartialLoader.createPrototype(type)
      if (PartialLoader.transparent(type)) return prototype
      PartialLoader.#prototypeCache.set(type, prototype)
    }
    return prototype
  }

  static createPrototype(type) {
    // To be javascript-ish this multi-extensible loader exposes 
    // a declarative representation, a "partial prototype", of the 
    // method table which answers many of the same questions a normal 
    // single-extensible prototype answers. For example,
    //    - What are the own/inherited keys/descriptors of the type?
    //    - What types does the type extend?
    //    - What members are overloaded and which take precidence?

    // The above questions are answered using a partial prototype with
    // the same ergonomics as the normal prototype. For example, a user 
    // would reflect on the partial prototype to get the own/inherited 
    // keys/descriptors the same way as would be done with a normal 
    // prototype chain. The same goes for collecting the extended types 
    // and establishing which member of which extended type takes 
    // precedence over other members.

    // The partial prototype must necessarily sacrifice some ergonomics
    // provided by the normal prototype. For example, there is not a 
    // one-to-one relationship between a partial prototype and its type.
    // Instead, only the first link in the chain has a one-to-one 
    // relationship with the type. Subsequent links contain copies of the 
    // keys/descriptors of the first link of their respective partial type.
    // Put another way, there are many partial prototype links for a given
    // type and while they all share the same key/descriptors they have
    // different next links. 

    // Practically, this all means that public APIs should not take a 
    // prototype link as an argument. Instead, APIs should take a type so 
    // they may get the prototype link themselves from the type. In this way, 
    // the API gets the *first* link of the chain which does have a one-to-one
    // relationship with the type and can be used to answer the same 
    // questions as a normal prototype with the same ergonomics; APIs
    // cannot assume a prototype link is the *first* link in the prototype
    // chain and so cannot use it to answer questions about the type 
    // returned by the constructor property.

    const plan = PartialLoader.getPlan(type)

    // Note: Host is null iff type is transparent. In this case, the plan as a
    // single step and the prototype degenerates to a bag of keys/descriptors 
    // with no prototype chain. This prototype should not be cached since 
    // it is only referenced by the type that declared it.
    
    let prototype = Object.create(null)
    for (let { host, transparent, descriptors$ } of plan) {

      if (host && host != type) {
        if (transparent) continue
        Object.defineProperties(prototype, 
          Object.getOwnPropertyDescriptors(
            PartialLoader.createPrototype(host)))
        prototype = Object.create(prototype)
        continue
      }

      Object.defineProperties(prototype, descriptors$)
    }

    // Note: The last step of the plan is always the type itself since the plan
    // is reversed depth-first deduplicated *post-order* walk of the type's 
    // partial types. This means the constructor property is always defined by 
    // the last step of the plan and so it is safe to set it here without 
    // worrying about overwriting an existing constructor property.

    prototype.constructor = type
    Object.defineProperty(prototype, 'constructor', { enumerable: false })
    return prototype
  }

  static associate(type, plan) {
    // cache elements of the tree traversal that created the plan

    for (let { host, keys, descriptors } of plan) {
      if (!host) continue

      if (type != host)
        PartialAssociate.addPartialType(type, host)

      for (const key of keys) {
        PartialAssociate.addKey(type, key)
        PartialAssociate.addHost(type, key, host)
      }

      for (const [key, descriptor] of descriptors) {
        PartialAssociate.addOwnKey(type, key)
        PartialAssociate.addOwnHost(type, key, host)

        if (!isAbstract(descriptor))
          PartialAssociate.setImplementingHost(type, key, host)
      }
    }    
  }

  static define$(prototype, { createThunk, type }) {
    const basePrototype = Object.getPrototypeOf(prototype)
    if (basePrototype) 
      PartialLoader.define$(basePrototype, { createThunk, type })

    const ctor = prototype.constructor
    for (const key of UserReflect.ownKeys(ctor)) {
      const descriptor = UserReflect.getOwnDescriptor(ctor, key)
      const thunk = createThunk(key, descriptor)
      if (!descriptor.configurable) continue
      PartialTypeReflect.defineProperty(type, key, thunk)
    }
  }

  static define(type, partialType, {
    createThunk = (ownKey, descriptor) => descriptor } = { }) {
    
    const plan = PartialLoader.getPlan(partialType)
    for (let { descriptors } of plan) {
      for (const [key, descriptor] of descriptors) {
        const thunk = createThunk(key, descriptor)
        PartialTypeReflect.defineProperty(type, key, thunk)
      }
    }

    // TODO: Remove above once logic is replicated below with
    // partial prototype.

    // PartialLoader.define$(
    //   PartialLoader.getPrototype(partialType), { createThunk, type })
  }
}
