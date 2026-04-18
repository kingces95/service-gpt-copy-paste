import { assert } from '@kingjs/assert'
import { getOwn } from '@kingjs/get-own'
import { asIterable } from '@kingjs/as-iterable'
import { isPojo } from '@kingjs/pojo-test'
import { isAbstract } from '@kingjs/abstract'
import { Prototype } from '@kingjs/prototype'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { Es6UserReflect } from '@kingjs/es6-user-reflect'
import { Es6Reflector } from '@kingjs/es6-reflector'
import { PartialType } from '@kingjs/partial-type'
import { 
  Implements, 
  Extends,
  Compile,
  Declarations,
  Define,
  Transparent,
  CreateThunk, 
  PartialTypes,
} from '@kingjs/partial-symbols'

// PROTOTYPE CHAINING

// PartialReflect transforms a type's prototype to include the partial types,
// if any, of which the type is composed. Each link in the prototype chain is
// expanded to include partial types declared on that type. PartialType 
// declarations on a type are ordered and later declarations take precidence
// over earlier ones.  For example, MyType and MyExtendedType:

//   class MyType { ... }
//   class MyExtendedType extends MyType { ... }

// have a prototype chain like this:

//   MyExtendedType.prototype -> MyType.prototype -> Object.prototype

// which can be represented as a tree where Object is implied:

//   MyExtendedType
//   └─ MyType

// and if MyExtendedType declares PartialTypse A and B, and MyType declares
// PartialType A, then MyType would have a prototype chain like this:

//   MyExtendedType
//   └─ B
//      └─ A
//         └─ MyType
//            └─ A

// Since the A on MyExtendedType reapplies the same members as the A on 
// MyType, the A on MyType is effectively ignored and can be removed. 
// So the final prototype chain would look like this:

//   MyExtendedType
//   └─ B
//      └─ A
//         └─ MyType

// PartialTypes can themselves declare PartialTypes, and so on. For example,
// if B declares PartialType Left and Right which each declare PartialType
// Base, then B's type hierarchy would look like this:

//   B
//   ├─ Left
//   │  └─ Base
//   └─ Right
//      └─ Base
 
// and the prototype chain would look like this:

//   B
//   └─ Right
//      └─ Base
//         └─ Left
//            └─ Base

// which after removig the duplicate Base becomes:

//   B
//   └─ Right
//      └─ Base
//         └─ Left

// then inserting that back into MyExtendedType's hierarchy gives:

//   MyExtendedType
//   └─ B
//      └─ Right
//         └─ Base
//            └─ Left
//               └─ MyType
//                  └─ A

// In general, the order of the prototype chain can be derived by doing
// a depth first post order walk of the type hierarchy tree where duplicate
// types are removed leaving the last one. For example, MyExtendedType has
// a hierarchy tree like this:

//   MyExtendedType
//   ├─ B
//   │  ├─ Right
//   │  │  └─ Base
//   │  └─ Left
//   │     └─ Base
//   └─ MyType
//      └─ A

// and the depth first post order walk of that tree is:

//   A, MyType, Base, Left, Base, Right, B, MyExtendedType

// which after removing the duplicate Base (keepting the last one) becomes:

//   A, MyType,       Left, Base, Right, B, MyExtendedType

// PARTIAL TYPE DECLARATIONS



const KnownTypes = [ Object, Function, PartialType ]
const KnownKeys = [ 'constructor' ]
const KnownStaticKeys = [ 'length', 'name', 'prototype',
  Implements, 
  Extends,
  CreateThunk, 
  Transparent,
  Define,
  Compile, 
  Declarations, 
  PartialTypes,
  Symbol.hasInstance,
]

export const PartialReflect = Es6Reflector.create({
  knownTypes: KnownTypes, 
  knownTypeFn: type => Object.getPrototypeOf(type) === PartialType,
  knownKeys: KnownKeys,
  knownStaticKeys: KnownStaticKeys,
  // TODO: suppress caching transparent prototypes?
  getPrototypeFn: function createPrototype(type) {
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
  },
})

export class PartialLoader {

  static *#declaredOwnPartialTypes(type) {
    const symbols = type[Declarations]
    if (!symbols) return

    // symbols like { [Extends]: { expectedType } }
    for (const symbol of Object.getOwnPropertySymbols(symbols)) {
      const options = symbols[symbol]
      const { expectedType } = options
      assert(!Array.isArray(expectedType))
      
      // TODO: see RangeConcept: Breaks trying to make iterable.
      const actualTypes = getOwn(type, symbol)
      for (let actualType of asIterable(actualTypes)) {
        if (isPojo(actualType))
          actualType = expectedType[Define](actualType)

        assert(!expectedType 
          || Es6Reflect.isExtensionOf(actualType, expectedType),
          `Type "${actualType.name}" is not an extension of expected type "${expectedType?.name}".`)
        yield actualType
      }
    }
  }

  static *#ownPartialTypes(type) {
    // added by declaration (e.g. by static [Extends] = PartialType)
    yield* PartialLoader.#declaredOwnPartialTypes(type)
      .filter(partialType => !partialType[Transparent])

    // added procedurally (e.g by extend() or implement())
    yield* type[PartialTypes] || []
  }

  static #isPartialType(type) {
    if (!type) return false
    if (type == PartialType) return true
    if (Object.getPrototypeOf(type) == PartialType) return false
    return Es6UserReflect.isExtensionOf(type, PartialType)
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

  static *hierarchy(rootType) {
    const visited = new Set()

    function *reverseDepthFirstWalk$(type) {
      if (visited.has(type)) return
      visited.add(type)
    
      const baseType = PartialLoader.#getBaseType(type)
      if (baseType)
        yield* reverseDepthFirstWalk$(baseType)
      
      const ownPartialTypes = [...PartialLoader.#ownPartialTypes(type)]
      for (const basePartialType of ownPartialTypes.reverse())
        yield *reverseDepthFirstWalk$(basePartialType)

      yield type
    }

    yield *reverseDepthFirstWalk$(rootType)
  }

  static #getOwnDescriptor(type, key) {
    const descriptor = Es6UserReflect.getOwnDescriptor(type, key)
    if (!descriptor) return null

    if (!PartialLoader.#isPartialType(type))
      return descriptor
    
    return type[Compile](descriptor) 
  }

  static *#transparentOwnPartialTypes(type) {
    for (const partialType of PartialLoader.#declaredOwnPartialTypes(type)) {
      if (!partialType[Transparent]) continue
      yield partialType
    }
  }

  static *ownDescriptors(type) {
    const ownKeys = new Map()
    const ownTypes = [...PartialLoader.#transparentOwnPartialTypes(type), type]
    for (const current of ownTypes.reverse()) {
      for (const key of Es6UserReflect.ownKeys(current)) {
        const descriptor = PartialLoader.#getOwnDescriptor(current, key)
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
