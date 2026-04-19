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

// META PROTOTYPE

// PartialReflect transforms a type's runtime-prototype to include the 
// partial types, if any, of which the type is composed and provides 
// reflection over the resulting meta-prototype chain.

// PartialReflect expands each link in the type's runtime-prototype chain 
// to include the partial types declared on that type. PartialType 
// declarations on a type are ordered. Later declarations take precidence 
// over earlier ones. For example, given MyType and MyExtendedType:

//   class MyType { ... }
//   class MyExtendedType extends MyType { ... }

// then instance of MyExtendedType have a prototype chain like this:

//   MyExtendedType.prototype -> MyType.prototype -> Object.prototype

// which can be represented as a tree where Object is implied:

//   MyExtendedType
//   └─ MyType

// and if MyExtendedType declares PartialTypse A then B, and MyType declares
// PartialType A, then PartialReflect would expand the prototype chain like 
// this:

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
// if B declares PartialType Left then Right which each declare PartialType
// Base, then B's type hierarchy would look like this (mentally, rotate the
// ASCII tree 90 degrees clockwise):

//   B
//   ├─ Right
//   │  └─ Base
//   └─ Left
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

// which is the "merge order" of the prototype chain where merge order means
// the order in which the members would be reduced when building the prototype
// chain.

// RECURSIVE DEFINITION OF META PROTOTYPE CHAIN

// In general, a type T with base type B nad partial types P0, P1, ... is 
// defined recursively as:

//    T
//    ├─ ...
//    ├─ P1
//    ├─ P0
//    └─ B

// The pseudo-code to discover the merge order is:

//    M(T) = dedupLast(M(B) ++ M(P0) ++ M(P1) ++ ... ++ [T])

// where M returns a list of types in merge order. DedupLast removes
// duplicates from a list keeping the last one. The ++ operator is list
// concatenation. The [T] is the singleton list containing T. 

// The list returned by M(T) is then reduced into a prototype chain. 
// Assuming the list is simply [ B, P0, P1, T ], then using mixin idiom, 
// the reduction is logically this:

//    const B$ = base => class extends base { ...B... }
//    const P0$ = base => class P0 extends base { ...P0... }
//    const P1$ = base => class P1 extends base { ...P1... }
//    const T$ = base => class T extends base { ...T... }
//    const { prototype } = T$(P1$(P0$(B$(Object))))

// Where the ...B... is copy of the members of B, and so on.

// IMPLEMENTATION OF META PROTOTYPE CHAIN

// The naive implementation of the meta prototype chain construction  
// proceeds by doing a post order walk of the type hierarchy tree 
// followed by deduplication of the resulting list. Deduping can be avoided 
// by doing a reverse pre order walk of the tree, pruning branches that 
// have been seen, and then reverse the result, so that is what 
// PartialReflect does.

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
    const hierarchy = [...PartialLoader.hierarchy(type)].reverse()
    
    const memberTable = new Map()
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
            let descriptor = current
            // inherit existing descriptor if current is abstract
            if (isAbstract(descriptor)) {
              const existing = memberTable.get(ownKey)
              if (existing) descriptor = existing 
            }
            descriptors[ownKey] = descriptor
            memberTable.set(ownKey, descriptor)
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

    // symbols like { [Extends]: expectedType }
    for (const symbol of Object.getOwnPropertySymbols(symbols)) {
      const expectedType = symbols[symbol]
      
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
    yield* getOwn(type, PartialTypes) || []
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
    
      yield type
      
      const ownPartialTypes = [...PartialLoader.#ownPartialTypes(type)]
      for (const basePartialType of ownPartialTypes.reverse())
        yield *reverseDepthFirstWalk$(basePartialType)

      const baseType = PartialLoader.#getBaseType(type)
      if (baseType)
        yield* reverseDepthFirstWalk$(baseType)
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
