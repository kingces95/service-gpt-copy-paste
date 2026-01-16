import { assert } from '@kingjs/assert'
import { isPojo } from '@kingjs/pojo-test'
import { Es6Reflect } from '@kingjs/es6-info'
import { isAbstract } from '@kingjs/abstract'
import { Es6Associate } from '@kingjs/es6-associate'
import { PartialPojo } from '@kingjs/partial-pojo'
import { PartialObject } from '@kingjs/partial-object'
import { Descriptor } from '@kingjs/descriptor'

// The PartialReflect API provides reflection over PartialObject. For
// example, to verify that a type is a PartialObject use:
//    PartialReflect.isPartialObject(type)

// To get the type of the PartialObject use:
//    PartialReflect.getPartialObjectType(type)
// For example, given the PartialObject defined above:
//    PartialReflect.getPartialObjectType(MyPartial) 
//      === PartialPojo

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
// 1. PartialReflect.partialObjects(type) returns set of 
//    PartialObject that contributed members to the type.
// 2. PartialReflect.hosts(type, key) returns, for each member 
//    key, the set of PartialObject that defined the key.
// 3. PartialReflect.getHost(type, key) returns, for each member 
//    key, the PartialObject that actually defined the key.

// PartialPojo PartialObject are well-known. They are transparent. 
// Their members will appear to be defined by the type itself. Continuing 
// the example:
//    PartialReflect.partialObjects(MyType) yields MyType
//    PartialReflect.hosts(MyType, 'myMethod') yields MyType
//    PartialReflect.getHost(MyType, 'myMethod') is MyType 

// Other well known PartialObjects are be defined as extensions of PartialObject. 
// For example, Concept extends PartialObject. These are not transparent and when
// merged onto a type their members are reported as defined by the PartialObject
// and not the type.

// Extends of PartialObject can override Compile to transform descriptors
// before being defined on the target type. For example, Concept overrides
// Compile to make all its members abstract. See Concept for more details.

// Extends of PartialObject can reference other PartialObject types and so form a 
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
//   PartialReflect.ownPartialObjects(type)
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
//   PartialReflect.partialObjects(MyType)
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

function defineName(type, name) {
  Object.defineProperties(type, {
    name: {
      value: name,
      configurable: true,
      enumerable: false,
      writable: false,
    }
  })
}

// Could be a static on Prototypical, but the point of Prototypical is to
// simplify the reflection Info layer by providing an object which has no
// known members other than those defined by PartialObject.
function prototypicalCreate(type) {

  let inheritedPrototypicalType = class extends Prototypical { }
  let prototypicalType = class extends inheritedPrototypicalType { }
  
  defineName(inheritedPrototypicalType, '$inheritedPrototypical_' + type.name)
  defineName(prototypicalType, '$prototypical_' + type.name)

  PartialReflect.mergeInherited$(inheritedPrototypicalType, type)
  PartialReflect.mergeOwn$(prototypicalType, type)
  
  Es6Associate.objectInitialize(inheritedPrototypicalType, 
    PartialReflect.PrototypicalHost, 
    () => type)
  
  // HACK: A PartialObject should not report being merged with itself.
  Es6Associate.setDelete(
    prototypicalType, 
    PartialReflect.Declarations, 
    type)
    
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

    const prototypicalType = Es6Associate.objectInitialize(
      type, PartialReflect.PrototypicalType, prototypicalCreate)

    return prototypicalType
  }

  static getPrototypicalHost$(type) {
    if (!(type.prototype instanceof Prototypical)) return type
    return Es6Associate.objectGet(type, PartialReflect.PrototypicalHost)
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

  static *ownPartialObjects(type) {
    if (PartialReflect.isPartialObject(type)) {
      yield* Es6Associate.ownTypes(type, 
        PartialObject.OwnCollectionSymbols)
    }
    else {
      yield* Es6Associate.ownTypes(type, 
        { [PartialReflect.Declarations]: { } })
    }
  }
  static *partialObjects(type) {
    if (PartialReflect.isPartialObject(type)) {
      const prototypicalType = PartialReflect.getPrototypicalType$(type)
      yield* PartialReflect.partialObjects(prototypicalType)
    }
    else {
      yield* Es6Associate.types(type, 
        { [PartialReflect.Declarations]: { } })
    }
  }

  static *ownKeys(type) { 
    if (PartialReflect.isPartialObject(type)) {
      for (const key of PartialReflect.keys(type)) {
        const host = PartialReflect.getHost(type, key)
        if (host != type) continue
        yield key
      }
    }
    else {
      for (const key of Es6Reflect.ownInstanceKeys(type)) {
        if (Es6Reflect.isKnownInstanceKey(type, key)) continue
        yield key
      }
    }
  }
  static *keys(type) { 
    if (PartialReflect.isPartialObject(type)) {
      const prototypicalType = PartialReflect.getPrototypicalType$(type)
      yield* PartialReflect.keys(prototypicalType)    
    } 
    else {
      for (const [key, host] of Es6Reflect.instanceMembers(type)) {
        if (Es6Reflect.isKnownInstanceKey(host, key)) continue
        yield key
      }
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
    return Descriptor.get(prototypicalType.prototype, key)
  }

  static getOwnDescriptors(type) {
    const descriptors = { }
    for (const key of Es6Reflect.ownInstanceKeys(type)) {
      if (Es6Reflect.isKnownInstanceKey(type, key)) continue
      descriptors[key] = PartialReflect.getOwnDescriptor(type, key)
    }
    return descriptors
  }
  static getDescriptors(type) {
    if (PartialReflect.isPartialObject(type)) {
      const prototypicalType = PartialReflect.getPrototypicalType$(type)
      return Es6Associate.objectInitialize(type, PartialReflect.Descriptors, 
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
    
    // only overwrite existing abstract members and then only
    // if the new member is not also abstract.
    if (key in prototype) {
      if (isAbstract(descriptor)) return false
      // const existingDescriptor = Descriptor.get(prototype, key)
      // if (!isAbstract(existingDescriptor)) return false
    }
      
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

  static associateKeys$(type, partialObject, keys) {
    assert(!(partialObject.prototype instanceof PartialPojo)) 

    for (const [key, defined] of keys) {
      Es6Associate.lookupAdd(type, PartialReflect.HostLookup, key, partialObject)
      if (!defined) continue
      Es6Associate.mapSet(type, PartialReflect.HostMap, key, partialObject)
    }
  }
  static mergeAssociations$(type, partialObject, keys) {
    assert(!(partialObject.prototype instanceof PartialPojo)) 
    
    const prototypicalType = PartialReflect.getPrototypicalType$(partialObject)
    Es6Associate.setCopy(type, prototypicalType, PartialReflect.Declarations)
    for (const [key, defined] of keys) {
      Es6Associate.lookupCopy(type, prototypicalType, PartialReflect.HostLookup, key)
      if (!defined) continue
      Es6Associate.mapCopy(type, prototypicalType, PartialReflect.HostMap, key)
    }
  }
  static mergeInherited$(type, partialObject) {
    if(type == PartialObject || type.prototype instanceof PartialObject) 
      throw `Expected type to not be a PartialObject.`

    assert(PartialReflect.isPartialObject(partialObject),
      `Expected partialObject to indirectly extend PartialObject.`)

    for (const child of PartialReflect.ownPartialObjects(partialObject)) {
      const descriptors = PartialReflect.getDescriptors(child)
      const keys = PartialReflect.defineProperties(type, descriptors)

      // PartialPojo members are transparent.
      if (child.prototype instanceof PartialPojo) {
        PartialReflect.associateKeys$(type, partialObject, keys)
        continue
      }

      Es6Associate.setAdd(type, PartialReflect.Declarations, child)
      PartialReflect.mergeAssociations$(type, child, keys)
    }
  }
  static mergeOwn$(type, partialObject) {
    if (type == PartialObject || type.prototype instanceof PartialObject) 
      throw `Expected type to not be a PartialObject.`

    assert(PartialReflect.isPartialObject(partialObject),
      `Expected partialObject to indirectly extend PartialObject.`)

    const descriptors = PartialReflect.getOwnDescriptors(partialObject)
    const keys = PartialReflect.defineProperties(type, descriptors)

    // PartialPojo members are transparent.
    if (partialObject.prototype instanceof PartialPojo) return

    Es6Associate.setAdd(type, PartialReflect.Declarations, partialObject)
    PartialReflect.associateKeys$(type, partialObject, keys)
  }
  static merge(type, partialObject) {
    PartialReflect.mergeInherited$(type, partialObject)
    PartialReflect.mergeOwn$(type, partialObject)
  }

  static *hosts(type, key) {
    // returns partial classes that could have defined the key
    // For example, all concepts that defined the key
    const prototypicalType = PartialReflect.getPrototypicalType$(type)
    if (!(key in prototypicalType.prototype)) return null
    const result = [...Es6Associate.lookupGet(
      prototypicalType, PartialReflect.HostLookup, key)]
    if (result.length == 0) yield type
    else yield* result
  }
  static getHost(type, key) {
    // returns partial class that defined the key
    const prototypicalType = PartialReflect.getPrototypicalType$(type)

    const host = Es6Reflect.getInstanceHost(prototypicalType, key)
    if (!host) return null
    if (Es6Reflect.isKnownInstanceKey(host, key)) return null
    return Es6Associate.mapGet(
      prototypicalType, PartialReflect.HostMap, key) || type
  }

  static defineType(pojoOrType) {
    if (isPojo(pojoOrType)) {
      const [type] = [class extends PartialPojo { }]
      const prototype = type.prototype
  
      for (const key of Reflect.ownKeys(pojoOrType)) {
        if (key === 'constructor') continue
        const descriptor = Object.getOwnPropertyDescriptor(pojoOrType, key)
        Object.defineProperty(prototype, key, descriptor)
      }
  
      return type
    }

    assert(Es6Reflect.isExtensionOf(pojoOrType, PartialObject),
      `Expected arg to be a PartialObject.`)

    return pojoOrType
  }
}
