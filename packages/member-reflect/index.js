import { assert } from '@kingjs/assert'
import { Reflection } from '@kingjs/reflection'
import { isAbstract } from '@kingjs/abstract'
import { Associated } from '@kingjs/associated'
import { PartialClass } from '@kingjs/partial-class'
import { MemberCollection } from '@kingjs/member-collection'

const {
  isExtensionOf,
  memberKeys,
  ownMemberKeys,
} = Reflection

// The MemberReflect API provides reflection over MemberCollection. For
// example, to verify that a type is a MemberCollection use:
//    MemberReflect.isCollection(type)

// To get the type of the MemberCollection use:
//    MemberReflect.getCollectionType(type)
// For example, given the member collection defined above:
//    MemberReflect.getCollectionType(MyPartial) === PartialClass

// To get the member keys defined on the member collection use:
//    MemberReflect.ownKeys(type)
// Continuing the example:
//    MemberReflect.ownKeys(MyPartial) yields 'myMethod'

// To get a member descriptor defined on the member collection use:
//    MemberReflect.getOwnDescriptor(type, key)
// Continuing the example:
//    MemberReflect.getOwnDescriptor(MyPartial, 'myMethod')
// returns the descriptor for myMethod

// To get all member descriptors defined on the member collection use:
//    MemberReflect.getOwnDescriptors(type)
// Continuing the example:
//    MemberReflect.getOwnDescriptors(MyPartial)
// returns an object with myMethod descriptors as members.

// To define a member using a standalone descriptor use:
//    MemberReflect.defineProperty(type, key, descriptor)
// Continuing the example:
//    MemberReflect.defineProperty(MyPartial, 'myMethod', descriptor)
// defines myMethod on MyPartial.prototype *except* if the descriptor
// is abstract and myMethod already exists on MyPartial.prototype.

// MemberReflect.merge(type, partialType) makes repeated calls
// to defineMember to copy the descriptors defined on partialType to the type. 
// Continuing the example:
//    class MyType { }
//    MemberReflect.merge(MyType, MyPartial)
// Now MyType.prototype has myMethod.

// MemberReflect provides methods for reflection over the resulting 
// merged type:
// 1. MemberReflect.collections(type) returns set of 
//    MemberCollections that contributed members to the type.
// 2. MemberReflect.hosts(type, key) returns, for each member 
//    key, the set of MemberCollections that defined the key.
// 3. MemberReflect.getHost(type, key) returns, for each member 
//    key, the member collection that actually defined the key.

// PartialClass MemberCollections are well-known. They are transparent. 
// Their members will appear to be defined by the type itself. Continuing 
// the example:
//    MemberReflect.collections(MyType) yields MyType
//    MemberReflect.hosts(MyType, 'myMethod') yields MyType
//    MemberReflect.getHost(MyType, 'myMethod') is MyType 

// A user defined MemberCollection can be defined by extending MemberCollection. 
// For example, Concept extends MemberCollection

// User defined types are not transparent and their members will appear to be 
// defined by the User defined MemberCollection.

// User defined partial types can override Compile to transform descriptors
// before being defined on the target type. For example, Concept overrides
// Compile to make all its members abstract. See Concept for more details.

// User defined partial types can reference other partial types and so form a 
// poset of partial types. OwnCollectionSymbols describes how to declare
// the partial types associated with a type of member collection. For example,
// if OwnCollectionSymbols is defined like this:
//   static [OwnDeclaraitionSymbols] = {
//     [MyPartials]: { expectedType: MyPartialType },
//   }
// then a member collection can declare its associated partial types like this:
//   static [MyPartials] = [ MyPartialType1, MyPartialType2 ]
// or
//   static [MyPartials] = MyPartialType1
// MemberReflect will return the associated partial types:
//   MemberReflect.ownCollections(type)
// OwnCollectionSymbols essentially defines "edges" in the poset of partial 
// types.

// MemberReflect has non-"own" variants that will walk the poset of
// MemberCollections. See collections, keys, getDescriptors, etc.

// MemberReflect non-"own" variants can also gather information
// for a merged type. For example, given:
//   class MyType { }
//   MemberReflect.merge(MyType, MyPartialType1)
//   MemberReflect.merge(MyType, MyPartialType2)
// then
//   MemberReflect.collections(MyType)
// yields MyPartialType1 and MyPartialType2
//   MemberReflect.keys(MyType)
// yields the union of the member keys defined by MyPartialType1 and
// MyPartialType2
//   MemberReflect.getDescriptors(MyType)
// yields the merged set of member descriptors defined by MyPartialType1
// and MyPartialType2
//   MemberReflect.getDescriptor(MyType, key)
// yields the member descriptor for key defined by either MyPartialType1
// or MyPartialType2 depending on which member collection actually defined
// the member.
//   MemberReflect.getHost(MyType, key)
// yields the member collection that actually defined key on MyType.
//   MemberReflect.hosts(MyType, key)
// yields the set of partial types that attempted to define key on MyType.
// For example, if both MyPartialType1 and MyPartialType2 defined key,
// then both partial types will be yielded even though only one of them
// actually defined key on MyType.

class Prototypical { }

export class MemberReflect {

  // The loader tracks the following assoications during loading. Note: The 
  // reflection uses these association to ensures that reflection accurately 
  // reflects what the loader actually did instead of trying to simulate it. 
  static Declarations = Symbol('MemberCollection.declarations')
  static HostLookup = Symbol('MemberReflect.hostLookup')
  static HostMap = Symbol('MemberReflect.hostMap')

  // Loading will cache intermediate transforms of partial types: 

  // First, for each member collection, a POJO of descriptors is created from 
  // the members defined on the member collection. 
  static Descriptors = Symbol('MemberReflect.descriptors')

  // Second, for each member collection, a prototypical type is created that
  // hosts all members defined by the member collection and its associated
  // partial types.
  static PrototypicalType = Symbol('MemberReflect.prototypicalType')

  static #getPrototypicalType(type) {
    if (!MemberReflect.isCollection(type)) return type

    return Associated.object(type, MemberReflect.PrototypicalType, () => {
      let prototypicalType = class extends Prototypical { }
      Object.defineProperties(prototypicalType, {
        name: {
          value: '$prototypical_' + type.name,
          configurable: true,
          enumerable: false,
          writable: false,
        }
      })
      MemberReflect.merge(prototypicalType, type)
      return prototypicalType
    })
  }  
  
  static getCollectionType(type) {
    const partialClass = Object.getPrototypeOf(type)
    if (Object.getPrototypeOf(partialClass) != MemberCollection) return null
    return partialClass
  }
  static isCollection(type) {
    return MemberReflect.getCollectionType(type) != null
  }

  static *ownCollections(type, { filterType } = { }) {
    if (MemberReflect.isCollection(type)) {
      yield* Associated.ownTypes(type, 
        MemberCollection.OwnCollectionSymbols,
        { filterType })
    }
    else {
      yield* Associated.types(type, 
        { [MemberReflect.Declarations]: { filterType } }, 
        { inherit: false })
    }
  }
  static *collections(type, { filterType } = { }) {
    if (MemberReflect.isCollection(type)) {
      const prototypicalType = MemberReflect.#getPrototypicalType(type)
      yield* [...MemberReflect.collections(prototypicalType, 
        { filterType })].filter(declaration => declaration != type)
    }
    else {
      yield* Associated.types(type, 
        { [MemberReflect.Declarations]: { filterType } }, 
        { inherit: true })
    }
  }

  static *ownKeys(type) { 
    if (MemberReflect.isCollection(type)) {
      yield* [...MemberReflect.keys(type)].filter(key => 
        MemberReflect.getHost(type, key) == type)
    }
    else {
      yield* ownMemberKeys(type.prototype) 
    }
  }
  static *keys(type) { 
    if (MemberReflect.isCollection(type)) {
      const prototypicalType = MemberReflect.#getPrototypicalType(type)
      yield* MemberReflect.keys(prototypicalType)    
    } 
    else {
      yield* memberKeys(type.prototype)
    }
  }

  static getOwnDescriptor(type, key) {
    const prototype = type.prototype
    const descriptor = Object.getOwnPropertyDescriptor(prototype, key)
    if (!MemberReflect.isCollection(type)) return descriptor
    return type[MemberCollection.Compile](descriptor) 
  }
  static getDescriptor(type, key) {
    const prototypicalType = MemberReflect.#getPrototypicalType(type)
    return Object.getOwnPropertyDescriptor(prototypicalType.prototype, key)
  }

  static getOwnDescriptors(type) {
    const descriptors = { }
    for (const key of ownMemberKeys(type.prototype))
      descriptors[key] = MemberReflect.getOwnDescriptor(type, key)
    return descriptors
  }
  static getDescriptors(type) {
    if (MemberReflect.isCollection(type)) {
      const prototypicalType = MemberReflect.#getPrototypicalType(type)
      return Associated.object(type, MemberReflect.Descriptors, () => 
        MemberReflect.getDescriptors(prototypicalType))
    }
    else {
      const descriptors = { }
      for (const key of MemberReflect.keys(type))
        descriptors[key] = MemberReflect.getDescriptor(type, key)
      return descriptors
    }
  }

  static defineProperty(type, key, descriptor) {
    const prototype = type.prototype
    // Skip adding abstract member to the prototype if a member already exists.
    if (key in prototype && isAbstract(descriptor)) return false
    Object.defineProperty(prototype, key, descriptor)
    return true
  }
  static defineProperties(type, descriptors) {
    const keys = []
    for (const key of Reflect.ownKeys(descriptors)) {
      const defined = MemberReflect.defineProperty(type, key, descriptors[key])
      keys.push([key, defined])
    }
    return keys
  }

  static verifyPartialClass(partialType) {
    if (!MemberReflect.isCollection(partialType))
      throw `Partial class must indirectly extend MemberCollection.`

    if (!isExtensionOf(partialType, PartialClass) && !partialType.name)
      throw `MemberCollection must have a name.`
  }

  static associate$(type, partialType, keys) {
    assert(!(partialType.prototype instanceof PartialClass)) 

    Associated.setAdd(type, MemberReflect.Declarations, partialType)
    for (const [key, defined] of keys) {
      Associated.lookupAdd(type, MemberReflect.HostLookup, key, partialType)
      if (!defined) continue
      Associated.mapSet(type, MemberReflect.HostMap, key, partialType)
    }
  }
  static mergeAssociations$(type, partialType, keys) {
    assert(!(partialType.prototype instanceof PartialClass)) 
    
    Associated.setAdd(type, MemberReflect.Declarations, partialType)

    const prototypicalType = MemberReflect.#getPrototypicalType(partialType)
    Associated.setCopy(type, prototypicalType, MemberReflect.Declarations)
    for (const [key, defined] of keys) {
      Associated.lookupCopy(type, prototypicalType, MemberReflect.HostLookup, key)
      if (!defined) continue
      Associated.mapCopy(type, prototypicalType, MemberReflect.HostMap, key)
    }
  }
  static merge(type, partialType) {
    if(type == MemberCollection || type.prototype instanceof MemberCollection) 
      throw `Expected type to not be a MemberCollection.`

    MemberReflect.verifyPartialClass(partialType)

    for (const declaration of MemberReflect.ownCollections(partialType)) {
      const descriptors = MemberReflect.getDescriptors(declaration)
      const keys = MemberReflect.defineProperties(type, descriptors)
      if (!(declaration.prototype instanceof PartialClass))
        MemberReflect.mergeAssociations$(type, declaration, keys)
      else
        MemberReflect.associate$(type, partialType, keys)
    }

    const descriptors = MemberReflect.getOwnDescriptors(partialType)
    const keys = MemberReflect.defineProperties(type, descriptors)
    if (!(partialType.prototype instanceof PartialClass))
      MemberReflect.associate$(type, partialType, keys)
  }

  static *hosts(type, key) {
    // returns map: key => concepts that define the key
    const prototypicalType = MemberReflect.#getPrototypicalType(type)
    if (!(key in prototypicalType.prototype)) return null
    yield* Associated.lookupGet(
      prototypicalType, MemberReflect.HostLookup, key) ?? [ type ]
  }
  static getHost(type, key) {
    // returns map: key => partial class that defined the key
    const prototypicalType = MemberReflect.#getPrototypicalType(type)
    if (!(key in prototypicalType.prototype)) return null
    return Associated.mapGet(
      prototypicalType, MemberReflect.HostMap, key) || type
  }
}
