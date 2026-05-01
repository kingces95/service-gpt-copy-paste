import { assert } from '@kingjs/assert'
import { isPojo } from '@kingjs/pojo-test'
import { getOwn } from '@kingjs/get-own'
import { asMetadata } from '@kingjs/as-metadata'
import { isAbstract } from '@kingjs/abstract'
import { linearize } from '@kingjs/linearize'
import { Es6UserReflect } from '@kingjs/es6-user-reflect'
import { Es6Reflector } from '@kingjs/es6-reflector'
import { Es6Prototype } from '@kingjs/es6-prototype'
import { PartialType } from '@kingjs/partial-type'
import { 
  Compile,
  Adjacent,
  From,
  Transparent, isTransparent,
  Precondition,
  CreateThunk,
} from '@kingjs/partial-symbols'

// _________________________________________________________________________
// MOTIVATION

// JavaScript before Es6 required the developer to construct prototypes
// manually. For example, to create a type MyExtendedType that extends MyType, 
// the developer would do something like this:

//    function MyType() { ... }
//    function MyExtendedType() { 
//      constructor() { MyType.call(this); ... }
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

// This is very powerful but it's also clunky. Es6 classes introduced syntactic
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
// declaration, or procedural means. For example, SitRep could be defined:

// (1) via extension like this:

//    class SitRep extends Fubar {
//      get bar() { ... }
//    }

// (2) via procedure like this:

//    class SitRep extends PartialClass {
//      static { define(this, Fubar) }
//      get bar() { ... }
//    }

// (3) via declaration like this:

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
// exposes the result as a meta-prototype chain. In general, PartialReflect 
// uses a last-declaration-wins ordering when constructing meta-prototype 
// chains where the precedence of the various means of composition are as 
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
// even when SitRep adds Fubar via define (i.e. procedurally) because define 
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

// _________________________________________________________________________
// PRECEDENTS

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
// chain reflects the source code declaration of a type and the prototype 
// chain reflects runtime composition of a type. PartialReflect expands upon 
// these Es6 precedents and uses them as justification for the inclusion of 
// partial types in the prototype chain and separation of the static-prototype 
// chain from the prototype chain.

// Where Es6 includes Object implicitly when it makes sense to do so, 
// PartialReflect includes partial types implicitly when it makes sense 
// to do so. 

// Where Es6 maintains two separate chains, a static-prototype chain and 
// a prototype PartialReflect extends Es6Reflector which includes 
// transformations of both chains. Es6Reflector supplies the transform for 
// the static-prototype (basically drops Function.prototype and 
// Object.prototype) thus is agnostic to the presence of partial types. 
// PartialReflect supplies the transform for the prototype chain. 

// _________________________________________________________________________
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

// PartialType can themselves declare PartialType, and so on. For example,
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

// which after removing the duplicate Base (keeping the last one) becomes:

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

// which after removing the duplicate Base (keeping the last one) becomes:

//   A, MyType,       Left, Base, Right, B, MyExtendedType

// which is the "merge order" of the prototype chain where merge order means
// the order in which the members would be reduced when building the prototype
// chain.

// _________________________________________________________________________
// RECURSIVE DEFINITION OF META PROTOTYPE CHAIN

// In general, a type T with base type B and partial types P0, P1, ... is 
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

// _________________________________________________________________________
// IMPLEMENTATION OF META PROTOTYPE CHAIN

// The naive implementation of the meta-prototype chain construction  
// proceeds by doing a post order walk of the type hierarchy tree 
// followed by deduplication of the resulting list. Deduping can be 
// avoided by doing a reverse pre order walk of the tree, pruning 
// branches that have been seen, and then reverse the result to
// produce a "merge order". That is what PartialReflect does:

function *adjacentTypes(type) {
  const baseType = getBaseType(type)
  if (baseType)
    yield baseType

  yield* ownPartialTypes(type)
}

function *mergeOrder(type) {
  const options = { preOrder: true, reverse: true }
  const precedenceOrder = [...linearize(type, adjacentTypes, options)]
  yield* precedenceOrder.reverse()
}

// _________________________________________________________________________
// ABSTRACT MEMBERS

// After the merge order is discovered, each link's constructor property
// can be assigned its type. Next, the own descriptors of that type's
// prototype are copied to the link. This is a straightforward copy 
// except for abstract descriptors. A descriptor is abstract if its 
// value/get/set is the well known abstract method. Abstract members do 
// not overwrite concrete members. Instead, the inherited concrete member
// is substituted. 

function isFirstOrOverride(descriptor, hasExisting) {
  return !hasExisting || !isAbstract(descriptor)
}

function resolve(descriptor, existing) {
  return isFirstOrOverride(descriptor, existing) 
    ? descriptor : existing
}


// _________________________________________________________________________
// TYPE OF PARTIAL TYPE DEFINITIONS & THE META TYPE SYSTEM

// There are many types of PartialType (i.e. PartialClass and Concept). 
// PartialReflect treats them all in the abstract using a meta type
// system to reflect on them to discover A set of well known meta 
// symbols.

const MetaSymbols = [
  Adjacent, 
  From,
  Transparent,  
  Compile,
  Precondition,
]

// Before a type of PartialType can be decorated with meta symbols, it must
// first be declared as a type of PartialType. This is done by extending
// directly from the well known type PartialType. For example, given

//    class PartialType extends null { ... }

// the these are types of PartialType:

//    class PartialClass extends PartialType { ... }
//    class Concept extends PartialType { ... }

// _________________________________________________________________________
// ADJACENT PARTIAL TYPE BY EXTENSION

// An extension of a type of PartialType is user defined partial type. 
// For example, A and B are user defined partial types:

//    class A extends PartialClass { ... }
//    class B extends Concept { ... }

// Testing for user defined partial types is done using 

//    PartialType.isUserDefined(type) // found in @kingjs/partial-type

// Note PartialType.isUserDefined returns false for PartialType and its 
// direct extensions (e.g. PartialClass and Concept) but returns true for 
// user defined partial types (e.g. A, B). 

// User defined partial type can extend other user defined partial
// types. For example, Base, Left and Right could be defined like,

//    class Base extends Concept { ... }
//    class Left extends Base { ... }
//    class Right extends Base { ... }

function getBaseType(type) {
  if (!type) return null

  if (!PartialType.isUserDefined(type))
    return Es6UserReflect.getBaseType(type)

  const result = Es6UserReflect.getBaseType(type)
  if (!PartialType.isUserDefined(result))
    return null

  return result
}

// Here are the base type chains for the above example:

//    PartialType -> null
//    PartialClass -> PartialType -> null
//    Concept -> PartialType -> null
//    MyExtendedType -> MyType -> Object -> null
//    MyType -> Object -> null

// The above chains should come as no surprise. The following chains of
// partial types may be more surprising since they do not report either
// PartialClass, Concept, or PartialType as base types:

//    A -> null
//    B -> null
//    Left -> Base -> null
//    Right -> Base -> null
//    Base -> null

// A resonable argument could be made to include PartialType and its direct
// extensions in the base type chain of user defined partial types however
// PartialType and its direct extensions have no members so their inclusion
// would only affect tests for their presence and those checks could be done
// using the static prototype chain. Additionally, their inclusion may not
// always appear at the end of the meta prototype chain given the current 
// implementation which seems odd. 

// _________________________________________________________________________
// ADJACENT PARTIAL TYPE BY DECLARATION

// Adjacent is a symbol declared by the meta type system which allows 
// types of PartialType to declare how user defined partial types can append 
// an additonal adjaceny list of partial type extensions to the base type
// (base type being interpreted as a singleton list). For example,

//    class Attachments extends PartialType {
//      static [Adjacent] = { 
//        [Defines]: Attachments 
//      }
//    }
//    class Concept extends PartialType {
//      static [Adjacent] = { 
//        [Defines]: Attachments 
//        [Implements]: Concept 
//      }
//    }
//    class PartialClass extends PartialType {
//      static [Adjacent] = { 
//        [Defines]: Attachments 
//        [Implements]: Concept
//        [Extends]: PartialClass 
//      }
//    }

// are examples of types of PartialType declaring what symbols host what
// types of adjacent partial type. The symbols declared as keys of the
// Adjacent object are not well known to PartialReflect. They are well 
// known to a type of PartialType like Concept or PartialClass.

// For example, from the above example, B could be defined like this:

//    class Base extends Concept { ... }
//    class Left extends Base { ... }
//    class Right extends Base { ... }
//    class B extends Concept {
//      static [Implements] = [ Left, Right ]
//    } 

// This declares a tree of partial types, possibly with duplicates 
// (e.g. POSET), from which a merge order (e.g. linearization) and 
// meta-prototype chain can be derived: 

//    POSET:            Merge Order:        Meta-Prototype chain:                  
//    B                 Right               B                     
//    ├─ Left           └─ Base             └─ Left                  
//    │  └─ Base           └─ Left             └─ Base                    
//    └─ Right                └─ B                └─ Right                  
//       └─ Base

function *ownDeclaredAdjacentPartialTypes(type) {
  const symbols = type[Adjacent]
  if (!symbols) 
    return

  for (const symbol of Object.getOwnPropertySymbols(symbols)) {
    const expectedType = symbols[symbol]
    const adjacentTypes = getOwn(type, symbol)
    for (let adjacentType of asMetadata(adjacentTypes))
      yield expectedType[From](adjacentType)
  }
}

// _________________________________________________________________________
// ADJACENT PARTIAL TYPE BY PROCEDURE

// Adjacent partial types can also be declared procedurally. For example, 
// given MyType, the following would declare MyExtenedPartialClass as an
// adjacent partial type of MyType:

//    class MyPartialClass extends PartialClass { ... }
//    class MyExtenedPartialClass extends PartialClass {
//      static { extend(this, MyPartialClass) }
//    }

// This is the only way to declare adjacent partial types on non-partial 
// types. For example, given MyType, the following would declare 
// MyPartialClass as an adjacent partial type of MyType:

//    class MyType { static { extend(this, MyPartialType) } ... }

// The placement of the static block is important. Members declared before the
// static block could be overridden by members of MyPartialType while members
// declared after the static block would override members of MyPartialType.

// The extends function is provided by PartialReflect and it stores the 
// adjacent partial type in a global registry which PartialReflect can query 
// when constructing the meta-prototype chain.

// The AdjacentTypes class is the implementation of the global registry for
// adjacent partial types declared procedurally. The AdjacentTypes registry is 
// keyed by the host type and the value is a set of adjacent partial types. For 
// example, if MyType declares MyPartialType as an adjacent partial type, then 
// the registry would have an entry like this:

//    MyType -> Set { MyPartialType }

// The adjacent type list is ordered. If a type is added multiple times, the 
// prior occurrence is removed and the type is added to the end of the list. 

// The adjacent type list is mutable until it is loaded. Once it is loaded, 
// it cannot be modified. Loading happens when the adjacent types are queried 
// for the first time. This is to prevent procedural declaration of adjacent 
// types after the meta-prototype chain has been constructed which typically
// happens at the first the type is extened by another type. For example,
// after MyType is extended by MyExtendedType, the meta-prototype chain of 
// MyPartialType would be constructed so any subsequent calls to extend 
// MyPartialType would generate an error:

//    extend(MyPartialType, MyExtendedPartialType) // error

class AdjacentTypes {

  static publish(type, ...types) {
    AdjacentTypes.#get(type).add(...types)
  }

  static *load(type) {
    const entry = AdjacentTypes.#get(type)
    yield* entry.load()
  }

  static #get(type) {
    let entry = this.#directory.get(type)
    if (!entry) this.#directory.set(type, entry = new AdjacentTypes())
    return entry
  }
  
  static #directory = new Map()

  #adjacentTypes
  #loaded = false

  constructor() {
    this.#adjacentTypes = new Set()
  }

  *load() { 
    this.#loaded = true 
    yield* this.#adjacentTypes
  }

  add(type) {
    assert(!this.#loaded,
      'Type cannot be modified after it has been loaded.')
    assert(!isTransparent(type),
      'Transparent types cannot be adjacent types.')

    this.#adjacentTypes.delete(type) // maintain order
    this.#adjacentTypes.add(type)
  }
}

function *ownPartialTypes(type) {

  // via declaration (e.g. static [Extends] = PartialType)
  yield* ownDeclaredAdjacentPartialTypes(type)
    .filter(partialType => !isTransparent(partialType))

  // via procedure (e.g extend())
  yield* AdjacentTypes.load(type)
}

const KnownTypes = [ Object, Function, PartialType ]
const KnownTypeFn = type => Object.getPrototypeOf(type) === PartialType
const KnownKeys = [ 'constructor' ]
const KnownStaticKeys = [ 
  'length', 'name', 'prototype',
  Symbol.hasInstance,
  ...MetaSymbols,
]

const compiledPrototype = new Es6Prototype({
  knownKeys: KnownKeys,
  cacheHint: () => false,
  getPrototype: function(type) {
    const compile = type[Compile] || (o => o)
    return Es6UserReflect.reduce([type], {
      filterOwn: true,
      map: (descriptor) => compile.call(type, descriptor)
    })
  }
})

const unifiedPrototype = new Es6Prototype({
  knownKeys: KnownKeys,
  getPrototype: function(type) {
    const transparentTypes = ownDeclaredAdjacentPartialTypes(type)
      .filter(partialType => isTransparent(partialType))
    const types = [ ...transparentTypes, type ]
    return compiledPrototype.reduce(types, { map: resolve })
  }
})

export function create({
  knownTypes = [],
  knownStaticKeys = [],
}) {
  const PartialReflect = Es6Reflector.create({
    knownTypes: [ ...knownTypes, ...KnownTypes ], 
    knownTypeFn: KnownTypeFn,
    knownKeys: KnownKeys,
    knownStaticKeys: [ ...KnownStaticKeys, ...knownStaticKeys ],
    cacheHint: type => !isTransparent(type),
    getPrototype: function(type) {
      return unifiedPrototype.reduce(mergeOrder(type), { map: resolve })
    }
  })

  function copyTo(partialType, type) {
    assert(typeof type === 'function',
      'Argument must be a type.')
    assert(PartialType.isUserDefined(partialType),
      'Argument must be a user defined PartialType.')
    
    const hosts = []
    const prototype = type.prototype
    PartialReflect.copyTo(partialType, prototype, {
      createThunk: (key, descriptor) => CreateThunk in type 
        ? type[CreateThunk](key, descriptor) 
        : descriptor,

      filter: (host, key, descriptor) =>
        isFirstOrOverride(descriptor, key in prototype),

      onHost: (host) => {
        host[Precondition]?.call(host, type)
        hosts.push(host)
      }
    })

    for (const host of hosts.filter(host =>!isTransparent(host)))
      AdjacentTypes.publish(type, host)
  }
  
  return { PartialReflect, copyTo }
}
