import { assert } from '@kingjs/assert'
import { getOwn } from '@kingjs/get-own'
import { asIterable } from '@kingjs/as-iterable'
import { isPojo } from '@kingjs/pojo-test'
import { isAbstract } from '@kingjs/abstract'
import { es6DefineType } from '@kingjs/es6-define-type'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { Es6UserReflect } from '@kingjs/es6-user-reflect'
import { PartialAssociate } from '@kingjs/partial-associate'
import { PartialType } from '@kingjs/partial-type'
import { Extensions } from '@kingjs/extensions'

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
    const type = PartialLoader.#define(pojoOrType)
    assert(PartialLoader.#isPartialType(type))
    return type
  }

  static #define(pojoOrType) {
    if (!isPojo(pojoOrType)) return pojoOrType
    return es6DefineType(null, Extensions, pojoOrType)
  }

  static #isExtensions(type) {
    return type?.prototype instanceof Extensions
  }

  static transparent(type) {
    return PartialLoader.#isExtensions(type)
  }

  static #getBaseType(type) {
    if (!type) return null

    if (!PartialLoader.#isPartialType(type))
      return Es6UserReflect.getBaseType(type)

    const result = Es6UserReflect.getBaseType(type)
    if (!PartialLoader.#isPartialType(result))
      return null

    return result
  }
  static #isPartialType(type) {
    if (!type) return false
    if (type == PartialType) return true
    if (Object.getPrototypeOf(type) == PartialType) return false
    return Es6UserReflect.isExtensionOf(type, PartialType)
  }

  static *#ownPartialTypes(type) {
    // added by declaration (e.g. by static [Extends] = PartialType)
    yield* PartialLoader.#declaredOwnPartialTypes(type)

    // added procedurally (e.g by extend() or implement())
    yield* PartialAssociate.ownPartialTypes(type)
  }

  static *#declaredOwnPartialTypes(type, symbols = PartialType.Declarations) {

    // if symbols typeof symbol, pull metadata off of type
    if (typeof symbols == 'symbol') symbols = type[symbols]
    if (!symbols) return
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

  static *#transparentTypes(type) {
    for (const partialType of PartialLoader.#ownPartialTypes(type)) {
      if (!PartialLoader.transparent(partialType)) continue
      yield partialType
    }
  }

  static *ownPartialTypes(type) {
    for (const partialType of PartialLoader.#ownPartialTypes(type)) {
      if (PartialLoader.transparent(partialType)) continue
      yield partialType
    }
  }

  // todo: remove; in use by tests
  static *declaredOwnPartialTypes$(type, symbols = PartialType.Declarations) {
    yield* PartialLoader.#declaredOwnPartialTypes(type, symbols)
  }

  static *hierarchy(rootType) {
    const visited = new Set()

    function *reverseDepthFirstWalk$(type) {
      if (visited.has(type)) return
      visited.add(type)
    
      const baseType = PartialLoader.#getBaseType(type)
      if (baseType)
        yield* reverseDepthFirstWalk$(baseType)
      
      const ownPartialTypes = [...PartialLoader.ownPartialTypes(type)]
      for (const basePartialType of ownPartialTypes.reverse())
        yield *reverseDepthFirstWalk$(basePartialType)

      yield type
    }

    yield *reverseDepthFirstWalk$(rootType)
  }

  static getOwnDescriptor(type, key) {
    const descriptor = Es6UserReflect.getOwnDescriptor(type, key)
    if (!descriptor) return null

    if (!PartialLoader.#isPartialType(type))
      return descriptor
    
    return type[PartialType.Compile](descriptor) 
  }

  static *ownDescriptors(type) {
    const ownKeys = new Map()
    for (const current of [
      ...PartialLoader.#transparentTypes(type), type].reverse()) {

      for (const key of Es6UserReflect.ownKeys(current)) {
        const descriptor = PartialLoader.getOwnDescriptor(current, key)
        if (ownKeys.has(key) && !isAbstract(ownKeys.get(key))) continue
        ownKeys.set(key, descriptor)
      }    
    }

    for (const [key, descriptor] of ownKeys) {
      yield key
      yield descriptor
    }
  }
}
