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
  PartialTypes,
} from '@kingjs/partial-symbols'

// MOTIVATION

// JavaScript before Es6 required the developer to construct prototypes
// manually. For example, to create a type MyExtendedType that extends MyType, 
// the developer would do something like this:

//    function MyType() { ... }
//    function MyExtendedType() { 
//      constuctor() { MyType.call(this); ... }
//    }
//    MyExtendedType.prototype = Object.create(MyType.prototype)
//    MyExtendedType.prototype.constructor = MyExtendedType

// Any member of MyType would be manually added to MyType.prototype. For 
// example, to add a 'foo' getter, the developer would do this:

//    Object.defineProperty(MyType.prototype, 'foo', {
//      get: function() { ... },
//      configurable: true,
//      enumerable: false,
//      writable: false,
//    })
 
// To ease manual construction of prototypes, a developer could use helper 
// functions. For example, 'foo' could be added like this:

//    function defineGetter(type, name, getter) {
//      Object.defineProperty(type.prototype, name, {
//        get: getter,
//        configurable: true,
//        enumerable: false,
//        writable: false,
//      })
//    }
//    defineGetter(MyType, 'foo', function() { ... })

// This is very powerful but its also clucky. Es6 classes introduced syntactic
// sugar to hide some of this boilerplate. For example, the above example
// could be rewritten like this:

//    class MyType { get foo() { ... } }
//    class MyExtendedType extends MyType { ... }

// Going further, a developer could create a function to add groups of 
// members, a "partial type", to a prototype. For example, to add 'foo' 
// and 'bar' to MyType in one go, the developer could do this:

//    function abstract() { throw new Error('Abstract method') }
//    function defineFubar(prototype, { foo, bar } = { }) {
//      addGetter(prototype, 'foo', foo || abstract)
//      addGetter(prototype, 'bar', bar || abstract)
//    }
//  
//    defineFubar(MyType.prototype)

// This would result in Fubar.foo overwriting MyType.foo and adding Foobar.bar.

// Es6 does not provide syntacic sugar for this type of composition. 
// For example, there is no Es6 syntax to define a partial type 'Fubar' and
// use that to add 'foo' and 'bar' to MyType. The Partial* family of packages
// fills this gap. While Partial* cannot introduce new syntax, it can introduce
// functions that interpret well known symbols to achieve the same effect. 
// For example, Fubar could be defined and applied to MyType like this:

//    // PartialType and PartialClass are provided out-of-the-box
//    class PartialType extends null { ... special sauce ... }
//    class PartialClass extends PartialType { ... more special sauce ... }
//
//    class Fubar extends PartialClass {
//      get foo() { ... }
//      get bar() { ... }
//    }
//    class MyType {
//      get Foo() { ... }
//      static { define(this, Fubar) }
//    }

// This would also result in Foobar.foo overwriting MyType.foo and adding 
// Foobar.bar. 

// Partial* also allows for composition of a PartialType via extension, 
// declaration, or procedural means. For example, SitRep could be defined 
// via extension like this:

//    class SitRep extends Fubar {
//      get bar() { ... }
//    }

// or via procedure like this:

//    class SitRep extends PartialClass {
//      static { define(this, Fubar) }
//      get bar() { ... }
//    }

// or via declaration like this:

//    class SitRep extends PartialClass {
//      static [Extends] = Fubar
//      get bar() { ... }
//    }

// In all cases, SitRep.bar would overwrite Fubar.bar and SitRep would 
// inherit Fubar.foo.
 
// Partial* also allows for "multiple inheritance" of partial types. For 
// example, SitRep could extend partial classes Fubar and Snafu like this:

//    class Snafu extends PartialClass {
//      get foo() { ... }
//      get baz() { ... }
//    }
//    class SitRep extends PartialClass {
//      static [Extends] = [ Snafu, Fubar ]
//      get bar() { ... }
//    }

// or via extension and declaration like this:

//    class SitRep extends Snafu {
//      static [Extends] = Fubar
//      get bar() { ... }
//    }

// or via declaration and procedure like this:

//    class SitRep extends PartialClass {
//      static [Extends] = Snafu
//      static { define(this, Fubar) }
//      get bar() { ... }
//    }

// PartialReflect imposes a total order on the POSET of partial types and
// exposes the result a meta-prototype chain. In general, PartialReflect 
// uses a last-declaration-wins ordering when constructing meta-prototype 
// chains where the precidents of the various means of composition are as 
// follows: 

//    extension < declaration < procedure = host type

// For example, given that precident chain, all of the above would have a 
// meta-prototype chain like this:

//    SitRep (bar)
//    └─ Fubar (foo, bar)
//       └─ Snafu (foo, baz)

// which indicates: 

//    SitRep.bar takes precidence over Fubar.bar 
//    Fubar.foo takes precidence over Snafu.foo 

// Note that SitRep.bar takes precidence over Fubar.bar because it was 
// declared after the call to define. If the order were reversed then the 
// precidence would be reversed and the meta-prototype chain would be:

//    SitRep (Fubar.bar)
//    └─ Fubar (foo, bar)
//       └─ Snafu (foo, baz)

// Hopefully, all of this is expected and in general the precidents 
// illustrated above feel natural. 

// As an aside, PartialReflect is able to add Fubar to the prototype chain 
// even when SitRep addes Fubar define (i.e. procedurally) because define 
// stores the association in a global registry which PartialReflect can query.

// PartialReflect will also construct meta-prototype chains for non-partial
// types (e.g. types that do not extened PartialType) and those meta-prototype
// chains will include the partial types of which the type is composed.
// For example, if MyType composes with SitRep like this:

//    class MyType {
//      static { define(this, SitRep) }
//      foo() { ... }
//    }

// Then PartialReflect would construct a meta-prototype chain like this:

//    MyType (foo)
//    └─ SitRep (bar)
//       └─ Fubar (foo, bar)
//          └─ Snafu (foo, baz)
//             └─ Object (toString, valueOf, ...)

// and MyType's prototype would be:

//    constructor -> MyType
//    bar         -> SitRep.bar
//    foo         -> Fubar.foo
//    baz         -> Snafu.baz

// Note the utility of the meta-prototype chain in this example. Reflection
// on the meta-prototype chain using the same algorithms used on a normal 
// prototype chain would reveal the total set of members, which members 
// overrode which, which partial types contributed which members, and so 
// on. The is is the main motivation for PartialReflect. 

// Es6 provides a precedent for including more types in the prototype chain
// than were declared in source code. Indeed, simply declaring 

//    class MyType { }

// results in a prototype chain that implicitly includes Object. Explictly
// extending Object does not change the prototype chain but it does change
// the static-prototype chain (i.e. the prototype of MyType as oppossed to
// the prototype of MyType.prototype). Furthermore extending null results
// in a different prototype chain but the same static-prototype chain.
// Here are the three cases:

// Definition:           Prototype chain:      Static-prototype chain:
// class MyType { }      MyType.prototype      MyType
//                       └─ Object.prototype   └─ Function.prototype
//                          └─ null               └─ Object.prototype
//                                                   └─ null
//                                                                   
// class MyType          MyType.prototype      MyType
//   extends Object { }  └─ Object.prototype   └─ Object
//                          └─ null               └─ Function.prototype
//                                                   └─ Object.prototype
//                                                      └─ null
//
// class MyType          MyType.prototype      MyType
//   extends null        └─ null               └─ Function.prototype
//                                                └─ Object.prototype
//                                                   └─ null

// The point is that Es6 established a precedent that the static-prototype
// chain reflects the source code declaration of types and the prototype 
// chain reflects runtime composition of types. 

// PartialReflect expands upon these Es6 precedents and uses them as 
// justification for the inclusion of partial types in the prototype chain; 
// Where Es6 includes Object implictly when it makes sense to do so, 
// PartialReflect include partial types implicitly when it makes sense to 
// do so. 

// PartialReflect extends Es6Reflector which includes transformations of 
// both chains. Es6Reflector supplies the transform for the static-prototype 
// (basically drops Function.prototype and Object.prototype) thus is agnostic 
// to the presence of partial types. PartialReflect supplies the transform 
// for the prototype chain. 


// META PROTOTYPE

// PartialReflect transforms a type's runtime-prototype to include the 
// partial types of which the type is composed and provides reflection 
// over the resulting meta-prototype chain.

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

// The naive implementation of the meta-prototype chain construction  
// proceeds by doing a post order walk of the type hierarchy tree 
// followed by deduplication of the resulting list. Deduping can be 
// avoided by doing a reverse pre order walk of the tree, pruning 
// branches that have been seen, and then reverse the result to
// produce a "merge order". That is what PartialReflect does:

function *hierarchy(rootType) {
  const visited = new Set()

  function *reversePreOrderWalk$(type) {
    if (visited.has(type)) return
    visited.add(type)
  
    yield type
    
    const basePartialTypes = [...ownPartialTypes(type)]
    for (const basePartialType of basePartialTypes.reverse())
      yield *reversePreOrderWalk$(basePartialType)

    const baseType = getBaseType(type)
    if (baseType)
      yield* reversePreOrderWalk$(baseType)
  }

  yield *reversePreOrderWalk$(rootType)
}

function *mergeOrder(type) {
  yield* [...hierarchy(type)].reverse()
}

// ABSTRACT MEMBERS

// After the merge order is discovered, each link's constructor property
// can be assigned its type. Next, the own descriptors of that type's
// prototype are copied to the link. This is a straightforward copy 
// except for abstract descriptors. A descriptor is abstract if its 
// value/get/set is the well known abstract method. Abstract members do 
// not overwrite concrete members. Instead, the inherited concrete member
// is substituted. 

export function isFirstOrOverride(descriptor, hasExisting) {
  return !hasExisting || !isAbstract(descriptor)
}

function override(descriptor, existing) {
  return isFirstOrOverride(descriptor, existing) 
    ? descriptor : existing
}


// PARTIAL TYPE META-META TYPE SYSTEM

// There are many types of PartialTypes (i.e. PartialClass and Concept). 
// PartialReflect treats them all in the abstract using a meta-meta type
// system to reflect on them. A type of PartialType is an extension of 
// PartialType. For example, given

//    class PartialType extends null { ... }

// the these are types of PartialType:

//    class PartialClass extends PartialType { ... }
//    class Concept extends PartialType { ... }

// An extension of a type of PartialType is user defined partial type. 
// For example, A is user defined partial types:

//    class A extends PartialClass { ... }
//    class B extends Concept { ... }

// Testing for user defined partial types is done using isPartialType.
// Note isPartialType returns false for PartialType and its direct
// extensions (e.g. PartialClass and Concept) but returns true for user
// defined partial types (e.g. A, B). 

// TODO: Export this and drop the test using depth = 2.
function isPartialType(type) {
  if (!type) return false
  if (type == PartialType) return true
  if (Object.getPrototypeOf(type) == PartialType) return false
  return Es6UserReflect.isExtensionOf(type, PartialType)
}

// User defined partial type can extend other user defined partial
// types. For example, Base, Left and Right could be defined like,

//    class Base extends Concept { ... }
//    class Left extends Base { ... }
//    class Right extends Base { ... }

function getBaseType(type) {
  if (!type) return null

  if (!isPartialType(type))
    return Es6UserReflect.getBaseType(type)

  const result = Es6UserReflect.getBaseType(type)
  if (!isPartialType(result))
    return null

  return result
}

// Here are the base type chains for the above example:

//    PartialType -> null
//    PartialClass -> PartialType -> null
//    Concept -> PartialType -> null
//    MyExtendedType -> MyType -> Object -> null
//    MyType -> Object -> null
//    A -> null
//    B -> null
//    Left -> Base -> null
//    Right -> Base -> null
//    Base -> null

// Declarations is a well known symbol declared by the meta-meta type system
// which allows types of PartialType to declare how its user defined partial 
// types can declare their partial type extensions. For example,

//    class PartialClass extends PartialType {
//      static [Declarations] = { 
//        [Extends]: PartialClass 
//      }
//    }
//    class Concept extends PartialType {
//      static [Declarations] = { 
//        [Extends]: PartialClass 
//        [Implements]: Concept
//      }
//    }



function *declaredOwnPartialTypes(type) {
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

export function publishExtensions(type, ...partialTypes) {
  let set = getOwn(type, PartialTypes)
  if (!set) type[PartialTypes] = set = new Set()
    
  for (const partialType of partialTypes) {
    set.delete(partialType) // deduplicate
    set.add(partialType)
  }
}

function *ownPartialTypes(type) {
  // via declaration (e.g. static [Extends] = PartialType)
  yield* declaredOwnPartialTypes(type)
    .filter(partialType => !partialType[Transparent])

  // via procedure (e.g extend() or implement())
  yield* getOwn(type, PartialTypes) || []
}

const OwnDescriptorsCache = new WeakMap()
function *ownDescriptors(type) {
  let ownDescriptors = OwnDescriptorsCache.get(type)
  if (!ownDescriptors) {
    ownDescriptors = [ ...ownDescriptors$(type) ]
    OwnDescriptorsCache.set(type, ownDescriptors)
  }
  yield* ownDescriptors
}
function *transparentOwnPartialTypes(type) {
  yield* declaredOwnPartialTypes(type)
    .filter(partialType => partialType[Transparent])
}
function *ownDescriptors$(type) {
  const ownKeys = new Map()
  const transparentTypes = transparentOwnPartialTypes(type)
  
  for (const current of [...transparentTypes, type]) {
    for (const key of Es6UserReflect.ownKeys(current)) {
      const descriptor = getOwnDescriptor(current, key)
      const existing = ownKeys.get(key)
      ownKeys.set(key, override(descriptor, existing))        
    }    
  }

  for (const [key, descriptor] of ownKeys) {
    yield key
    yield descriptor
  }
}

function getOwnDescriptor(type, key) {
  const descriptor = Es6UserReflect.getOwnDescriptor(type, key)
  if (!descriptor) return null

  if (!isPartialType(type))
    return descriptor
  
  return type[Compile](descriptor) 
}

const KnownTypes = [ Object, Function, PartialType ]
const KnownTypeFn = type => Object.getPrototypeOf(type) === PartialType
const KnownKeys = [ 'constructor' ]
const KnownStaticKeys = [ 'length', 'name', 'prototype',
  Declarations, 
  Compile, 
  Transparent,
  Define,
  Extends,
  Implements, 
  PartialTypes,
  Symbol.hasInstance,
]

export const PartialReflect = Es6Reflector.create({
  knownTypes: KnownTypes, 
  knownTypeFn: KnownTypeFn,
  knownKeys: KnownKeys,
  knownStaticKeys: KnownStaticKeys,
  // TODO: suppress caching transparent prototypes?
  getPrototypeFn: function createPrototype(type) {
    const memberTable = new Map()
    const types = [...mergeOrder(type)]
    return types.reduce((prototype, currentType) => {
      const descriptors = { }

      let ownKey
      for (const current of ownDescriptors(currentType)) {
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
            const existing = memberTable.get(ownKey)
            descriptors[ownKey] = override(descriptor, existing)
            memberTable.set(ownKey, descriptor)
            break
        }
      }

      return Prototype.create(currentType, prototype, descriptors)
    }, null)
  },
})
