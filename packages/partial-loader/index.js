import { assert } from '@kingjs/assert'
import { Es6UserReflect } from '@kingjs/es6-user-reflect'
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
import { Es6Prototype } from '@kingjs/es6-prototype'

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

  static *#ownPartialTypes(type) {
    assert(PartialTypeReflect.isPartialType(type))
    // added by declaration (e.g. by static [Extends] = PartialType)
    yield* PartialLoader.#declaredOwnPartialTypes(type)

    // added procedurally (e.g by extend() or implement())
    yield* PartialAssociate.ownPartialTypes(type)

    // added by inheritance (e.g. by extending a partial type)
    yield* PartialLoader.#inheritedPartialTypes(type)
  }
  static *#declaredOwnPartialTypes(type, symbols = PartialType.Declarations) {

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
  static *#inheritedPartialTypes(type) {
    const baseType = PartialTypeReflect.baseType(type)
    if (!baseType) return
    yield* PartialLoader.#inheritedPartialTypes(baseType)
    yield baseType
  }
  // todo: remove
  static *declaredOwnPartialTypes$(type, symbols = PartialType.Declarations) {
    yield* PartialLoader.#declaredOwnPartialTypes(type, symbols)
  }
  static *ownPartialTypes(type) {
    yield* PartialLoader.#ownPartialTypes(type)
  }
  static *partialTypes(rootPartialType) {
    assert(PartialTypeReflect.isPartialType(rootPartialType))

    const visited = new Set()

    function *reverseDepthFirstWalk$(partialType) {
      if (visited.has(partialType)) return
      visited.add(partialType)
      
      const ownPartialTypes = [...PartialLoader.ownPartialTypes(partialType)]
      for (const basePartialType of ownPartialTypes.reverse())
        yield *reverseDepthFirstWalk$(basePartialType)

      yield partialType
    }

    yield *reverseDepthFirstWalk$(rootPartialType)
  }

  static getOwnDescriptor(type, key) {
    assert(PartialTypeReflect.isPartialType(type))
    const descriptor = Es6UserReflect.getOwnDescriptor(type, key)
    if (!descriptor) return null
    return type[PartialType.Compile](descriptor) 
  }
  static *#ownDescriptors(type) {
    assert(PartialTypeReflect.isPartialType(type))
    for (const key of Es6UserReflect.ownKeys(type)) {
      const descriptor = PartialLoader.getOwnDescriptor(type, key)
      yield key
      yield descriptor
    }
  }
  static *ownDescriptors(type) {
    yield* PartialLoader.#ownDescriptors(type)
  }

  static getPlan(rootPartialType) {
    const visited = new Set()
    const isTransparent = PartialLoader.transparent(rootPartialType)
    const plan = [{ 
      host: isTransparent ? null : rootPartialType,
      keys: new Set(),
      descriptors: Object.create(null),
    }]

    assert(!PartialTypeReflect.isKnown(rootPartialType))

    function reverseDepthFirstWalk$(partialType) {
      assert(PartialTypeReflect.isPartialType(partialType))    
        
      const step = plan[plan.length - 1]
      const { keys, descriptors } = step

      if (visited.has(partialType)) return new Set()
        visited.add(partialType)
      
      const ownPartialTypes = [...PartialLoader.ownPartialTypes(partialType)]
      for (const basePartialType of ownPartialTypes.reverse()) {
        if (!PartialLoader.transparent(basePartialType)) {
          plan.push({
            host: basePartialType,
            keys: new Set(),
            descriptors: Object.create(null),
          })
        }
        for (const key of reverseDepthFirstWalk$(basePartialType))
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
            if (isAbstract(descriptor) && descriptors[ownKey]) continue
            descriptors[ownKey] = descriptor
            break
          default: assert(false, `Unexpected type: ${typeof current}`)
        }
      }

      return keys
    }

    reverseDepthFirstWalk$(rootPartialType)
    return plan.reverse()
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

      for (const key of Reflect.ownKeys(descriptors)) {
        const descriptor = descriptors[key]
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
    for (const key of Es6UserReflect.ownKeys(ctor)) {
      const descriptor = Es6UserReflect.getOwnDescriptor(ctor, key)
      const thunk = createThunk(key, descriptor)
      if (!descriptor.configurable) continue
      PartialTypeReflect.defineProperty(type, key, thunk)
    }
  }

  static define(type, partialType, {
    createThunk = (ownKey, descriptor) => descriptor } = { }) {
    
    const plan = PartialLoader.getPlan(partialType)
    for (let { descriptors } of plan) {
      for (const key of Reflect.ownKeys(descriptors)) {
        const descriptor = descriptors[key]
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
