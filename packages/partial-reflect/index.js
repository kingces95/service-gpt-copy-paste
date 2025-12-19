import { assert } from '@kingjs/assert'
import { isPojo } from '@kingjs/pojo-test'
import { Reflection } from '@kingjs/reflection'
import { isAbstract } from '@kingjs/abstract'
import { Associate } from '@kingjs/associate'
import { TransparentPartialClass } from '@kingjs/transparent-partial-class'
import { PartialObject } from '@kingjs/partial-object'

const {
  memberKeys,
  ownMemberKeys,
  isExtensionOf,
} = Reflection

// The PartialReflect API provides reflection over PartialObject. For
// example, to verify that a type is a PartialObject use:
//    PartialReflect.isPartialObject(type)

// To get the type of the PartialObject use:
//    PartialReflect.getPartialObjectType(type)
// For example, given the PartialObject defined above:
//    PartialReflect.getPartialObjectType(MyPartial) 
//      === TransparentPartialClass

// Suppose we reflect on a PartialObject defined like this:
//    const MyPartial = PartialReflect.defineType({
//      myMethod() { ... }
//    }) 

// To get the member keys defined on the PartialObject use:
//    PartialReflect.ownKeys(type)
// Continuing the example:
//    PartialReflect.ownKeys(MyPartial) yields 'myMethod'

// To get a member descriptor defined on the PartialObject use:
//    PartialReflect.getOwnDescriptor(type, key)
// Continuing the example:
//    PartialReflect.getOwnDescriptor(MyPartial, 'myMethod')
// returns the descriptor for myMethod

// To get all member descriptors defined on the PartialObject use:
//    PartialReflect.getOwnDescriptors(type)
// Continuing the example:
//    PartialReflect.getOwnDescriptors(MyPartial)
// returns an object with the myMethod descriptor as a member.

// To define a member using a standalone descriptor use:
//    PartialReflect.defineProperty(type, key, descriptor)
// Continuing the example:
//    PartialReflect.defineProperty(MyPartial, 'myMethod', descriptor)
// defines myMethod on MyPartial.prototype *except* if the descriptor
// is abstract and myMethod already exists on MyPartial.prototype.

// PartialReflect.merge(type, partialType) makes repeated calls
// to defineMember to copy the descriptors defined on partialType to the type. 
// Continuing the example:
//    class MyType { }
//    PartialReflect.merge(MyType, MyPartial)
// Now MyType.prototype has myMethod.

// PartialReflect provides methods for reflection over the resulting 
// merged type:
// 1. PartialReflect.collections(type) returns set of 
//    PartialObject that contributed members to the type.
// 2. PartialReflect.hosts(type, key) returns, for each member 
//    key, the set of PartialObject that defined the key.
// 3. PartialReflect.getHost(type, key) returns, for each member 
//    key, the PartialObject that actually defined the key.

// TransparentPartialClass PartialObject are well-known. They are transparent. 
// Their members will appear to be defined by the type itself. Continuing 
// the example:
//    PartialReflect.collections(MyType) yields MyType
//    PartialReflect.hosts(MyType, 'myMethod') yields MyType
//    PartialReflect.getHost(MyType, 'myMethod') is MyType 

// Other well known PartialObjects are be defined as extensions of PartialObject. 
// For example, Concept extends PartialObject. These are not transparent and when
// merged onto a type their members are reported as defined by the PartialObject
// and not the type.

// Extensions of PartialObject can override Compile to transform descriptors
// before being defined on the target type. For example, Concept overrides
// Compile to make all its members abstract. See Concept for more details.

// Extensions of PartialObject can reference other PartialObject types and so form a 
// poset of PartialObject types. OwnCollectionSymbols describes how to declare
// the PartialObject types associated with a type of PartialObject. For example,
// if OwnCollectionSymbols is defined like this:
//   static [OwnDeclaraitionSymbols] = {
//     [MyPartials]: { expectedType: MyPartialType },
//   }
// then a PartialObject can declare its associated PartialObject types like this:
//   static [MyPartials] = [ MyPartialType1, MyPartialType2 ]
// or
//   static [MyPartials] = MyPartialType1
// PartialReflect will return the associated PartialObject types:
//   PartialReflect.ownCollections(type)
// OwnCollectionSymbols essentially defines "edges" in the poset of partial 
// types.

// PartialReflect has non-"own" variants that will walk the poset of
// PartialObject. See collections, keys, getDescriptors, etc.

// PartialReflect non-"own" variants can also gather information
// for a merged type. For example, given:
//   class MyType { }
//   PartialReflect.merge(MyType, MyPartialType1)
//   PartialReflect.merge(MyType, MyPartialType2)
// then
//   PartialReflect.collections(MyType)
// yields MyPartialType1 and MyPartialType2
//   PartialReflect.keys(MyType)
// yields the union of the member keys defined by MyPartialType1 and
// MyPartialType2
//   PartialReflect.getDescriptors(MyType)
// yields the merged set of member descriptors defined by MyPartialType1
// and MyPartialType2
//   PartialReflect.getDescriptor(MyType, key)
// yields the member descriptor for key defined by either MyPartialType1
// or MyPartialType2 depending on which PartialObject actually defined
// the member.
//   PartialReflect.getHost(MyType, key)
// yields the PartialObject that actually defined key on MyType.
//   PartialReflect.hosts(MyType, key)
// yields the set of PartialObject types that attempted to define key on MyType.
// For example, if both MyPartialType1 and MyPartialType2 defined key,
// then both PartialObject types will be yielded even though only one of them
// actually defined key on MyType.

class Prototypical { }

// Could be a static on Prototypical, but the point of Prototypical is to
// simplify the reflection Info layer by providing an object which has no
// known members other than those defined by PartialObject.
function prototypicalCreate(type) {
  let prototypicalType = class extends Prototypical { }
  Object.defineProperties(prototypicalType, {
    name: {
      value: '$prototypical_' + type.name,
      configurable: true,
      enumerable: false,
      writable: false,
    }
  })
  PartialReflect.merge(prototypicalType, type)
  return prototypicalType
}

export class PartialReflect {

  // The loader tracks the following assoications during loading. Note: 
  // reflection uses these association to ensure reflection accurately 
  // reflects what the loader actually did instead of trying to simulate it. 
  static Declarations = Symbol('PartialObject.declarations')
  static HostLookup = Symbol('PartialReflect.hostLookup')
  static HostMap = Symbol('PartialReflect.hostMap')

  // Loading will cache intermediate transforms of PartialObject types: 

  // First, for each PartialObject, a POJO of descriptors is created from 
  // the members defined on the PartialObject. 
  static Descriptors = Symbol('PartialReflect.descriptors')

  // Second, for each PartialObject, a prototypical type is created that
  // hosts all members defined by the PartialObject and its associated
  // PartialObject types.
  static PrototypicalType = Symbol('PartialReflect.prototypicalType')

  // Third, for each prototypical type, a reverse mapping back to the
  // PartialObject that defined each member is created.
  static PrototypicalHost = Symbol('PartialReflect.prototypicalHost')

  static getPrototypicalType$(type) {
    if (!PartialReflect.isPartialObject(type)) return type

    const prototypicalType = Associate.object(
      type, PartialReflect.PrototypicalType, prototypicalCreate)

    Associate.object(
      prototypicalType, 
      PartialReflect.PrototypicalHost, 
      () => type)

    // Patch up caches on the prototypical type. The prototypical type
    // is a stand-in for the PartialObject but what we have so far
    // is a class that is merged with the PartialObject. The difference
    // being that a stand-in would not be associated with the member 
    // collection itself. So we need to remove the association that
    // points back to the PartialObject itself.

    // HACK: Remove the collection from the Declarations set.
    Associate.setDelete(
      prototypicalType, 
      PartialReflect.Declarations, 
      type)

    return prototypicalType
  }

  static getPrototypicalHost$(type) {
    if (!(type.prototype instanceof Prototypical)) return type
    return Associate.object(type, PartialReflect.PrototypicalHost)
  }

  static getPartialObjectType(type) {
    const prototype = Object.getPrototypeOf(type)
    if (prototype == PartialObject) return null
    if (Object.getPrototypeOf(prototype) != PartialObject) {
      assert(!(prototype.prototype instanceof PartialObject),
        `Expected type to indirectly extend PartialObject.`)
      return null
    }

    return prototype
  }
  static isPartialObject(type) {
    return PartialReflect.getPartialObjectType(type) != null
  }

  static *ownCollections(type) {
    if (PartialReflect.isPartialObject(type)) {
      yield* Associate.ownTypes(type, 
        PartialObject.OwnCollectionSymbols)
    }
    else {
      yield* Associate.types(type, 
        { [PartialReflect.Declarations]: { } }, 
        { inherit: false })
    }
  }
  static *collections(type) {
    if (PartialReflect.isPartialObject(type)) {
      const prototypicalType = PartialReflect.getPrototypicalType$(type)
      yield* PartialReflect.collections(prototypicalType)
    }
    else {
      yield* Associate.types(type, 
        { [PartialReflect.Declarations]: { } }, 
        { inherit: true })
    }
  }

  static *ownKeys(type) { 
    if (PartialReflect.isPartialObject(type)) {
      yield* [...PartialReflect.keys(type)].filter(key => 
        PartialReflect.getHost(type, key) == type)
    }
    else {
      yield* ownMemberKeys(type.prototype) 
    }
  }
  static *keys(type) { 
    if (PartialReflect.isPartialObject(type)) {
      const prototypicalType = PartialReflect.getPrototypicalType$(type)
      yield* PartialReflect.keys(prototypicalType)    
    } 
    else {
      yield* memberKeys(type.prototype)
    }
  }

  static getOwnDescriptor(type, key) {
    const prototype = type.prototype
    const descriptor = Object.getOwnPropertyDescriptor(prototype, key)
    if (!PartialReflect.isPartialObject(type)) return descriptor
    return type[PartialObject.Compile](descriptor) 
  }
  static getDescriptor(type, key) {
    const prototypicalType = PartialReflect.getPrototypicalType$(type)
    return Object.getOwnPropertyDescriptor(prototypicalType.prototype, key)
  }

  static getOwnDescriptors(type) {
    const descriptors = { }
    for (const key of ownMemberKeys(type.prototype))
      descriptors[key] = PartialReflect.getOwnDescriptor(type, key)
    return descriptors
  }
  static getDescriptors(type) {
    if (PartialReflect.isPartialObject(type)) {
      const prototypicalType = PartialReflect.getPrototypicalType$(type)
      return Associate.object(type, PartialReflect.Descriptors, 
        () => PartialReflect.getDescriptors(prototypicalType))
    }
    else {
      const descriptors = { }
      for (const key of PartialReflect.keys(type))
        descriptors[key] = PartialReflect.getDescriptor(type, key)
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
      const defined = PartialReflect.defineProperty(type, key, descriptors[key])
      keys.push([key, defined])
    }
    return keys
  }

  static associateKeys$(type, collection, keys) {
    assert(!(collection.prototype instanceof TransparentPartialClass)) 

    for (const [key, defined] of keys) {
      Associate.lookupAdd(type, PartialReflect.HostLookup, key, collection)
      if (!defined) continue
      Associate.mapSet(type, PartialReflect.HostMap, key, collection)
    }
  }
  static mergeAssociations$(type, collection, keys) {
    assert(!(collection.prototype instanceof TransparentPartialClass)) 
    
    const prototypicalType = PartialReflect.getPrototypicalType$(collection)
    Associate.setCopy(type, prototypicalType, PartialReflect.Declarations)
    for (const [key, defined] of keys) {
      Associate.lookupCopy(type, prototypicalType, PartialReflect.HostLookup, key)
      if (!defined) continue
      Associate.mapCopy(type, prototypicalType, PartialReflect.HostMap, key)
    }
  }
  static merge(type, collection) {
    if(type == PartialObject || type.prototype instanceof PartialObject) 
      throw `Expected type to not be a PartialObject.`

    assert(PartialReflect.isPartialObject(collection),
      `Expected collection to indirectly extend PartialObject.`)

    for (const child of PartialReflect.ownCollections(collection)) {
      const descriptors = PartialReflect.getDescriptors(child)
      const keys = PartialReflect.defineProperties(type, descriptors)

      // TransparentPartialClass members are transparent.
      if (child.prototype instanceof TransparentPartialClass) {
        PartialReflect.associateKeys$(type, collection, keys)
        continue
      }

      Associate.setAdd(type, PartialReflect.Declarations, child)
      PartialReflect.mergeAssociations$(type, child, keys)
    }

    const descriptors = PartialReflect.getOwnDescriptors(collection)
    const keys = PartialReflect.defineProperties(type, descriptors)

    // TransparentPartialClass members are transparent.
    if (collection.prototype instanceof TransparentPartialClass) return

    Associate.setAdd(type, PartialReflect.Declarations, collection)
    PartialReflect.associateKeys$(type, collection, keys)
  }

  static *hosts(type, key) {
    // returns map: key => concepts that define the key
    const prototypicalType = PartialReflect.getPrototypicalType$(type)
    if (!(key in prototypicalType.prototype)) return null
    yield* Associate.lookupGet(
      prototypicalType, PartialReflect.HostLookup, key) ?? [ type ]
  }
  static getHost(type, key) {
    // returns map: key => partial class that defined the key
    const prototypicalType = PartialReflect.getPrototypicalType$(type)
    if (!(key in prototypicalType.prototype)) return null
    return Associate.mapGet(
      prototypicalType, PartialReflect.HostMap, key) || type
  }

  static defineType(pojoOrType) {
    if (isPojo(pojoOrType)) {
      const [type] = [class extends TransparentPartialClass { }]
      const prototype = type.prototype
  
      for (const key of ownMemberKeys(pojoOrType)) {
        const descriptor = Object.getOwnPropertyDescriptor(pojoOrType, key)
        Object.defineProperty(prototype, key, descriptor)
      }
  
      return type
    }

    assert(isExtensionOf(pojoOrType, PartialObject),
      `Expected arg to be a PartialObject.`)

    return pojoOrType
  }
}
