import { assert } from '@kingjs/assert'
import { UserReflect } from '@kingjs/user-reflect'
import { ExtensionsReflect } from '@kingjs/extensions'
import { PartialType, PartialTypeReflect } from '@kingjs/partial-type'
import { getOwn } from '@kingjs/get-own'
import { asIterable } from '@kingjs/as-iterable'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { PartialAssociate } from '@kingjs/partial-associate'

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
    const type = ExtensionsReflect.define(pojoOrType)
    assert(PartialTypeReflect.isPartialType(type))
    return type
  }

  static *ownPartialTypes(type) {
    assert(PartialTypeReflect.isPartialType(type))
    // added by declaration (e.g. by static [Extends] = PartialType)
    yield* PartialLoader.declaredOwnPartialTypes$(type, PartialType.PartialTypes)
    
    // added procedurally (e.g by extend() or implement())
    yield* PartialAssociate.ownPartialTypes(type)
    
    // added by inheritance (e.g. by extending a partial type)
    yield* PartialLoader.inheritedPartialTypes$(type)
  }
  static *declaredOwnPartialTypes$(type, symbols) {

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
}
