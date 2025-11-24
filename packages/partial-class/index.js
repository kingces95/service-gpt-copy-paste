import { assert } from '@kingjs/assert'
import { Reflection } from '@kingjs/reflection'
import { Compiler } from '@kingjs/compiler'
import { Es6ClassInfo } from '@kingjs/es6-info'
import { isPojo } from '@kingjs/pojo-test'
import { isAbstract } from '@kingjs/abstract'
import { Descriptor } from '@kingjs/descriptor'

const {
  isExtensionOf,
  memberNamesAndSymbols,
  ownMemberNamesAndSymbols,
  associatedTypes,
  associatedOwnTypes,
  associatedSetAdd,
  associatedSetCopy,
  associatedMapSet,
  associatedMapGet,
  associatedMapCopy,
  associatedLookupGet,
  associatedLookupAdd,
  associatedLookupCopy,
  associatedObject,
} = Reflection

// The PartialClass abstraction is like Object.defineProperties but the
// descriptors are provided as members of an extension of an extension of
// PartialClass where the first extension represents the type of partial
// class and the second extension hosts the user defined members.

// AnonymousPartialClass which extends PartialClass is provided out-of-
// the-box to define partial anonymous partial types from POJOs. For example:
//    const MyPartial = AnonymousPartialClass.create({
//      myMethod() { ... }
//    }) 

// The PartialClassReflect API provides reflection over PartialTypes. For
// example, to verify that a type is a PartialClass use:
//    PartialClassReflect.isPartialClass(type)

// To get the type of the partial class use:
//    PartialClassReflect.getPartialClass(type)
// For example, given the partial type defined above:
//    PartialClassReflect.getPartialClass(MyPartial) === AnonymousPartialClass

// To get the member keys defined on the partial type use:
//    PartialClassReflect.ownMemberKeys(type)
// Continuing the example:
//    PartialClassReflect.ownMemberKeys(MyPartial) yields 'myMethod'

// To get a member descriptor defined on the partial type use:
//    PartialClassReflect.getOwnMemberDescriptor(type, key)
// Continuing the example:
//    PartialClassReflect.getOwnMemberDescriptor(MyPartial, 'myMethod')
// returns the descriptor for myMethod

// To get all member descriptors defined on the partial type use:
//    PartialClassReflect.getOwnMemberDescriptors(type)
// Continuing the example:
//    PartialClassReflect.getOwnMemberDescriptors(MyPartial)
// returns an object with myMethod descriptors as members.

// To define a member using a standalone descriptor use:
//    PartialClassReflect.defineMember(type, key, descriptor)
// Continuing the example:
//    PartialClassReflect.defineMember(MyPartial, 'myMethod', descriptor)
// defines myMethod on MyPartial.prototype *except* if the descriptor
// is abstract and myMethod already exists on MyPartial.prototype.

// PartialClassReflect.mergeMembers(type, partialType) makes repeated calls
// to defineMember to copy the descriptors defined on partialType to the type. 
// Continuing the example:
//    class MyType { }
//    PartialClassReflect.mergeMembers(MyType, MyPartial)
// Now MyType.prototype has myMethod.

// The PartialClassReflect API provides reflection over the resulting 
// merged type. These include:
// 1. The set of partial types that contributed members to the type.
//    PartialClassReflect.declarations(type) returns this set.
// 2. For each member key, the set of partial types that defined the key.
//    PartialClassReflect.memberHosts(type, key) returns this set.
// 3. For each member key, the partial type that actually defined the key.
//    PartialClassReflect.getMemberHost(type, key) returns this type.
// AnonymousPartialClass partial types are transparent so their members
// will appear to be defined by the type itself. Continuing the example:
//    PartialClassReflect.declarations(MyType) yields MyType
//    PartialClassReflect.memberHosts(MyType, 'myMethod') yields MyType
//    PartialClassReflect.getMemberHost(MyType, 'myMethod') is MyType 

// Custom partial types can be defined by extending PartialClass. For
// example, Concept extends PartialClass to define concept partial types.
// See Concept for more details. Custom partial types are not transparent
// so their members will appear to be defined by the custom partial type.

// Custom partial types can reference other partial types and so form a 
// poset of partial types. OwnDeclarationSymbols describes how to declare
// the partial types associated with a type of partial type. 

// PartialClassReflect has non-"own" variants that will walk the poset of
// partial types yielding partial types reachable from the supplied 
// partial type (declarations), the set of keys (memberKeys), the set of 
// descriptors (getMemberDescriptors), or the descriptor for a given slot
// (getMemberDescriptor). The same members can be used to reflect on a
// type that has been merged with one or more partial types. 

// --

// Compile transforms a descriptor before being copied to the target type. 
// For example, a concept partial type can apply a policy that all its 
// members are "abstract" by setting all get/set/value to abstract for 
// non-data members. Compile is called with the descriptor and returns 
// a descriptor.
const Compile = Symbol('PartialClass.compile')

// OwnDeclarationSymbols describes how types are associated with the
// PartialClass so that the poset of associated types can be traversed.
const OwnDeclarationSymbols = Symbol('PartialClass.ownDeclaraitionSymbols')

// The loader tracks the following assoications during loading. Note: The 
// reflection uses these association to ensures that reflection accurately 
// reflects what the loader actually did instead of trying to simulate it. 
const Declarations = Symbol('PartialClass.declarations')
const MemberHostLookup = Symbol('PartialClassReflect.memberHostLookup')
const MemberHostMap = Symbol('PartialClassReflect.memberHostMap')
const PrototypicalType = Symbol('PartialClassReflect.prototypicalType')
const Descriptors = Symbol('PartialClassReflect.descriptors')

export class PartialClass {
  static Symbol = {
    ownDeclaraitionSymbols: OwnDeclarationSymbols,
    compile: Compile,
  }

  constructor() {
    throw new TypeError('PartialClass cannot be instantiated.')
  }

  static [OwnDeclarationSymbols] = { }
  static [Compile](descriptor) { return Compiler.compile(descriptor) }
}

class PrototypicalPartialType { }

export class AnonymousPartialClass extends PartialClass { 
  static create(pojo) {
    assert(isPojo(pojo), 'pojo must be a POJO')

    const [type] = [class extends AnonymousPartialClass { }]
    const prototype = type.prototype

    for (const key of ownMemberNamesAndSymbols(pojo)) {
      const descriptor = Object.getOwnPropertyDescriptor(pojo, key)
      Object.defineProperty(prototype, key, descriptor)
    }

    return type
  }
}

export class PartialClassReflect {

  static #getPrototypicalType(type) {
    if (!PCReflect.isPartialClass(type)) return type

    return associatedObject(type, PrototypicalType, () => {
      let prototypicalType = class extends PrototypicalPartialType { }
      Object.defineProperties(prototypicalType, {
        name: {
          value: '$prototypical_' + type.name,
          configurable: true,
          enumerable: false,
          writable: false,
        }
      })
      PCReflect.mergeMembers(prototypicalType, type)
      return prototypicalType
    })
  }  
  
  static getPartialClass(type) {
    const partialClass = Object.getPrototypeOf(type)
    if (Object.getPrototypeOf(partialClass) != PartialClass) return null
    return partialClass
  }
  static isPartialClass(type) {
    return PCReflect.getPartialClass(type) != null
  }

  static *ownDeclarations(type, { filterType } = { }) {
    if (PCReflect.isPartialClass(type)) {
      yield* associatedOwnTypes(type, 
        OwnDeclarationSymbols,
        { filterType })
    }
    else {
      yield* associatedTypes(type, 
        { [Declarations]: { filterType } }, 
        { inherit: false })
    }
  }
  static *declarations(type, { filterType } = { }) {
    if (PCReflect.isPartialClass(type)) {
      const prototypicalType = PCReflect.#getPrototypicalType(type)
      yield* [...PCReflect.declarations(prototypicalType, 
        { filterType })].filter(declaration => declaration != type)
    }
    else {
      yield* associatedTypes(type, 
        { [Declarations]: { filterType } }, 
        { inherit: true })
    }
  }

  static *ownMemberKeys(type) { 
    if (PCReflect.isPartialClass(type)) {
      yield * [...PCReflect.memberKeys(type)].filter(key => 
        PCReflect.getMemberHost(type, key) == type)
    }
    else {
      yield* ownMemberNamesAndSymbols(type.prototype) 
    }
  }
  static *memberKeys(type) { 
    if (PCReflect.isPartialClass(type)) {
      const prototypicalType = PCReflect.#getPrototypicalType(type)
      yield* PCReflect.memberKeys(prototypicalType)    
    } 
    else {
      yield* memberNamesAndSymbols(type.prototype)
    }
  }

  static getOwnMemberDescriptor(type, key) {
    const prototype = type.prototype
    const descriptor = Object.getOwnPropertyDescriptor(prototype, key)
    if (!PCReflect.isPartialClass(type)) return descriptor
    return type[Compile](descriptor) 
  }
  static getMemberDescriptor(type, key) {
    const prototypicalType = PCReflect.#getPrototypicalType(type)
    return Object.getOwnPropertyDescriptor(prototypicalType.prototype, key)
  }

  static getOwnMemberDescriptors(type) {
    const descriptors = { }
    for (const key of ownMemberNamesAndSymbols(type.prototype))
      descriptors[key] = PCReflect.getOwnMemberDescriptor(type, key)
    return descriptors
  }
  static getMemberDescriptors(type) {
    if (PCReflect.isPartialClass(type)) {
      const prototypicalType = PCReflect.#getPrototypicalType(type)
      return associatedObject(type, Descriptors, () => 
        PCReflect.getMemberDescriptors(prototypicalType))
    }
    else {
      const descriptors = { }
      for (const key of PCReflect.memberKeys(type))
        descriptors[key] = PCReflect.getMemberDescriptor(type, key)
      return descriptors
    }
  }

  static defineMember(type, key, descriptor) {
    const prototype = type.prototype
    // Skip adding abstract member to the prototype if a member already exists.
    if (key in prototype && isAbstract(descriptor)) return false
    Object.defineProperty(prototype, key, descriptor)
    return true
  }
  static defineMembers(type, descriptors) {
    const keys = []
    for (const key of Reflect.ownKeys(descriptors)) {
      const defined = PCReflect.defineMember(type, key, descriptors[key])
      keys.push([key, defined])
    }
    return keys
  }

  static verifyPartialClass(partialType) {
    if (!PCReflect.isPartialClass(partialType))
      throw `Partial class must indirectly extend PartialClass.`

    if (!isExtensionOf(partialType, AnonymousPartialClass) && !partialType.name)
      throw `PartialClass must have a name.`
  }

  static associate$(type, partialType, keys) {
    assert(!(partialType.prototype instanceof AnonymousPartialClass)) 

    associatedSetAdd(type, Declarations, partialType)
    for (const [key, defined] of keys) {
      associatedLookupAdd(type, MemberHostLookup, key, partialType)
      if (!defined) continue
      associatedMapSet(type, MemberHostMap, key, partialType)
    }
  }
  static mergeAssociations$(type, partialType, keys) {
    assert(!(partialType.prototype instanceof AnonymousPartialClass)) 
    
    associatedSetAdd(type, Declarations, partialType)

    const prototypicalType = PCReflect.#getPrototypicalType(partialType)
    associatedSetCopy(type, prototypicalType, Declarations)
    for (const [key, defined] of keys) {
      associatedLookupCopy(type, prototypicalType, MemberHostLookup, key)
      if (!defined) continue
      associatedMapCopy(type, prototypicalType, MemberHostMap, key)
    }
  }
  static mergeMembers(type, partialType) {
    if(type == PartialClass || type.prototype instanceof PartialClass) 
      throw `Expected type to not be a PartialClass.`

    PCReflect.verifyPartialClass(partialType)

    for (const declaration of PCReflect.ownDeclarations(partialType)) {
      const descriptors = PCReflect.getMemberDescriptors(declaration)
      const keys = PCReflect.defineMembers(type, descriptors)
      if (!(declaration.prototype instanceof AnonymousPartialClass))
        PCReflect.mergeAssociations$(type, declaration, keys)
      else
        PCReflect.associate$(type, partialType, keys)
    }

    const descriptors = PCReflect.getOwnMemberDescriptors(partialType)
    const keys = PCReflect.defineMembers(type, descriptors)
    if (!(partialType.prototype instanceof AnonymousPartialClass))
      PCReflect.associate$(type, partialType, keys)
  }

  static *memberHosts(type, key) {
    // returns map: key => concepts that define the key
    const prototypicalType = PCReflect.#getPrototypicalType(type)
    if (!(key in prototypicalType.prototype)) return null
    yield* associatedLookupGet(
      prototypicalType, MemberHostLookup, key) ?? [ type ]
  }
  static getMemberHost(type, key) {
    // returns map: key => partial class that defined the key
    const prototypicalType = PCReflect.#getPrototypicalType(type)
    if (!(key in prototypicalType.prototype)) return null
    return associatedMapGet(
      prototypicalType, MemberHostMap, key) || type
  }
}

const PCReflect = PartialClassReflect
