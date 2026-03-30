import { assert } from '@kingjs/assert'
import { Es6UserReflect } from '@kingjs/es6-user-reflect'
import { ExtensionsReflect } from '@kingjs/extensions'
import { 
  PartialType, 
  PartialTypeReflect,
} from '@kingjs/partial-type'
import { getOwn } from '@kingjs/get-own'
import { asIterable } from '@kingjs/as-iterable'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { PartialAssociate } from '@kingjs/partial-associate'
import { isAbstract } from '@kingjs/abstract'

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

  static *hierarchy(rootPartialType) {
    assert(PartialTypeReflect.isPartialType(rootPartialType))

    const visited = new Set()

    function *reverseDepthFirstWalk$(partialType) {
      if (visited.has(partialType)) return
      visited.add(partialType)
    
      const baseType = PartialTypeReflect.baseType(partialType)
      if (baseType)
        yield* reverseDepthFirstWalk$(baseType)
      
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

  static *ownDescriptors(type) {
    assert(PartialTypeReflect.isPartialType(type))

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
