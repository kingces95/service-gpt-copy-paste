import { assert } from '@kingjs/assert'
import { getOwn } from '@kingjs/get-own'
import { asIterable } from '@kingjs/as-iterable'
import { isPojo } from '@kingjs/pojo-test'
import { isAbstract } from '@kingjs/abstract'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { Es6UserReflect } from '@kingjs/es6-user-reflect'
import { PartialType } from '@kingjs/partial-type'
import {
  Compile, 
  Declarations, 
  Transparent,
  Define
} from '@kingjs/partial-symbols'
import { Prototype } from '@kingjs/prototype'

export function createPrototype(type) {
  const hierarchy = [...PartialLoader.hierarchy(type)]
  
  return hierarchy.reduce((prototype, currentType) => {
    const descriptors = { }

    let ownKey
    for (const current of PartialLoader.ownDescriptors(currentType)) {
      assert(typeof current == 'object'
        || typeof current == 'string' 
        || typeof current == 'symbol',
        `Unexpected type: ${typeof current}`)

      switch (typeof current) {
        case 'string':
        case 'symbol':
          ownKey = current 
        break
        case 'object':
          // inherit existing descriptor if current is abstract
          if (isAbstract(current)) {
            const existing = descriptors[ownKey]
            if (existing && !isAbstract(existing))
              current = existing
          }
          descriptors[ownKey] = current
          break
      }
    }

    return Prototype.create(currentType, prototype, descriptors)
  }, null)
}

const PartialTypes = new Map()

export class PartialLoader {

  static addPartialType(type, partialType) {
    assert(PartialLoader.#isPartialType(partialType))
    if (type[Transparent]) return
    if (!PartialTypes.has(type)) PartialTypes.set(type, [])
    PartialTypes.get(type).push(partialType)
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
    yield* PartialTypes.get(type) || []
  }

  static *#declaredOwnPartialTypes(type, symbols = Declarations) {

    // if symbols typeof symbol, pull metadata off of type
    if (typeof symbols == 'symbol') symbols = type[symbols]
    if (!symbols) return
    assert(symbols != null, 'failed to find metadata symbols on type.')

    // symbols like { [TheSymbol]: { expectedType } }
    for (const symbol of Object.getOwnPropertySymbols(symbols)) {
      const options = symbols[symbol]
      const { expectedType } = options
      assert(!Array.isArray(expectedType))
      const actualTypes = getOwn(type, symbol)

      // TODO: see RangeConcept: Breaks trying to make iterable.
      for (let actualType of asIterable(actualTypes)
        .map(o => !isPojo(o) ? o : expectedType[Define](o))) {

        assert(!expectedType 
          || Es6Reflect.isExtensionOf(actualType, expectedType),
          `Type "${actualType.name}" is not an extension of expected type "${expectedType?.name}".`)
        yield actualType
      }
    }
  }

  static *#transparentTypes(type) {
    for (const partialType of PartialLoader.#ownPartialTypes(type)) {
      if (!partialType[Transparent]) continue
      yield partialType
    }
  }

  static *ownPartialTypes(type) {
    for (const partialType of PartialLoader.#ownPartialTypes(type)) {
      if (partialType[Transparent]) continue
      yield partialType
    }
  }

  // todo: remove; in use by tests
  static *declaredOwnPartialTypes$(type, symbols = Declarations) {
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
    
    return type[Compile](descriptor) 
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
