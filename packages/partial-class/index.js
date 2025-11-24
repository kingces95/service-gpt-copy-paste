import { assert } from '@kingjs/assert'
import { Reflection } from '@kingjs/reflection'
import { Compiler } from '@kingjs/compiler'
import { isPojo } from '@kingjs/pojo-test'
import { isAbstract } from '@kingjs/abstract'
import { Associated } from '@kingjs/associated'

const {
  isExtensionOf,
  memberNamesAndSymbols,
  ownMemberNamesAndSymbols,
} = Reflection

// The PartialClass abstraction is like Object.defineProperties but the
// descriptors are an extension of PartialClass. 

// AnonymousPartialClass which extends PartialClass is provided out-of-
// the-box to define anonymous partial types from POJOs. For example:
//    const MyPartial = AnonymousPartialClass.create({
//      myMethod() { ... }
//    }) 
// The method could also be defined using a descriptor:
//    const MyPartial = AnonymousPartialClass.create({
//      myMethod: { value: function() { ... } }
//    })
// or as a lambda:
//    const MyPartial = AnonymousPartialClass.create({
//      myMethod: () => { ... }
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

// PartialClassReflect provides methods for reflection over the resulting 
// merged type:
// 1. PartialClassReflect.declarations(type) returns the set of partial 
//    types that contributed members to the type.
// 2. PartialClassReflect.memberHosts(type, key) returns, for each member 
//    key, the set of partial types that defined the key.
// 3. PartialClassReflect.getMemberHost(type, key) returns, for each member 
//    key, the partial type that actually defined the key.

// AnonymousPartialClass partial types are transparent so their members
// will appear to be defined by the type itself. Continuing the example:
//    PartialClassReflect.declarations(MyType) yields MyType
//    PartialClassReflect.memberHosts(MyType, 'myMethod') yields MyType
//    PartialClassReflect.getMemberHost(MyType, 'myMethod') is MyType 

// Custom partial types can be defined by extending PartialClass. For
// example, Concept extends PartialClass to define concept partial types.
// See Concept for more details. Custom partial types are not transparent
// so their members will appear to be defined by the custom partial type.

// Custom partial types can override Compile to transform descriptors
// before being defined on the target type. For example, Concept overrides
// Compile to make all its members abstract. See Concept for more details.

// Custom partial types can reference other partial types and so form a 
// poset of partial types. OwnDeclarationSymbols describes how to declare
// the partial types associated with a type of partial type. For example,
// if OwnDeclarationSymbols is defined like this:
//   static [OwnDeclaraitionSymbols] = {
//     [MyPartials]: { expectedType: MyPartialType },
//   }
// then a partial type can declare its associated partial types like this:
//   static [MyPartials] = [ MyPartialType1, MyPartialType2 ]
// or
//   static [MyPartials] = MyPartialType1
// Reflection can then be used to reflect on the associated partial types:
//   PartialClassReflect.ownDeclarations(type, { filterType: MyPartialType })
// which yields the partial types associated with type via the MyPartials
// symbol. OwnDeclarationSymbols essentially defines "edges" in the poset 
// of partial types.

// PartialClassReflect has non-"own" variants that will walk the poset of
// partial types yielding partial types reachable from the supplied 
// partial type (declarations), the set of keys (memberKeys), the set of 
// descriptors (getMemberDescriptors), or the descriptor for a given slot
// (getMemberDescriptor).

// PartialClassReflect non-"own" variants can also gather information
// for a merged type. For example, given:
//   class MyType { }
//   PartialClassReflect.mergeMembers(MyType, MyPartialType1)
//   PartialClassReflect.mergeMembers(MyType, MyPartialType2)
// then
//   PartialClassReflect.declarations(MyType)
// yields MyPartialType1 and MyPartialType2
//   PartialClassReflect.memberKeys(MyType)
// yields the union of the member keys defined by MyPartialType1 and
// MyPartialType2
//   PartialClassReflect.getMemberDescriptors(MyType)
// yields the merged set of member descriptors defined by MyPartialType1
// and MyPartialType2
//   PartialClassReflect.getMemberDescriptor(MyType, key)
// yields the member descriptor for key defined by either MyPartialType1
// or MyPartialType2 depending on which partial type actually defined
// the member.
//   PartialClassReflect.getMemberHost(MyType, key)
// yields the partial type that actually defined key on MyType.
//   PartialClassReflect.memberHosts(MyType, key)
// yields the set of partial types that attempted to define key on MyType.
// For example, if both MyPartialType1 and MyPartialType2 defined key,
// then both partial types will be yielded even though only one of them
// actually defined key on MyType.

// --

// Compile transforms a descriptor before being copied to the target type. 
// For example, a concept partial type can apply a policy that all its 
// members are "abstract" by setting all get/set/value to abstract for 
// non-data members. Compile is called with the descriptor and returns 
// a descriptor.
export const Compile = Symbol('PartialClass.compile')

// OwnDeclarationSymbols describes how types are associated with the
// PartialClass so that the poset of associated types can be traversed.
export const OwnDeclarationSymbols = Symbol('PartialClass.ownDeclaraitionSymbols')

// The loader tracks the following assoications during loading. Note: The 
// reflection uses these association to ensures that reflection accurately 
// reflects what the loader actually did instead of trying to simulate it. 
const Declarations = Symbol('PartialClass.declarations')
const MemberHostLookup = Symbol('PartialClassReflect.memberHostLookup')
const MemberHostMap = Symbol('PartialClassReflect.memberHostMap')

// Loading will cache intermediate transforms of partial types: 

// First, for each partial type, a POJO of descriptors is created from 
// the members defined on the partial type. 
const Descriptors = Symbol('PartialClassReflect.descriptors')

// Second, for each partial type, a prototypical type is created that
// hosts all members defined by the partial type and its associated
// partial types.
const PrototypicalType = Symbol('PartialClassReflect.prototypicalType')

export class PartialClass {
  constructor() { throw new TypeError('PartialClass cannot be instantiated.') }
  static [OwnDeclarationSymbols] = { }
  static [Compile](descriptor) { return Compiler.compile(descriptor) }
}

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

class PrototypicalPartialType { }

export class PartialClassReflect {

  static #getPrototypicalType(type) {
    if (!PCReflect.isPartialClass(type)) return type

    return Associated.object(type, PrototypicalType, () => {
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
      yield* Associated.ownTypes(type, 
        OwnDeclarationSymbols,
        { filterType })
    }
    else {
      yield* Associated.types(type, 
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
      yield* Associated.types(type, 
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
      return Associated.object(type, Descriptors, () => 
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

    Associated.setAdd(type, Declarations, partialType)
    for (const [key, defined] of keys) {
      Associated.lookupAdd(type, MemberHostLookup, key, partialType)
      if (!defined) continue
      Associated.mapSet(type, MemberHostMap, key, partialType)
    }
  }
  static mergeAssociations$(type, partialType, keys) {
    assert(!(partialType.prototype instanceof AnonymousPartialClass)) 
    
    Associated.setAdd(type, Declarations, partialType)

    const prototypicalType = PCReflect.#getPrototypicalType(partialType)
    Associated.setCopy(type, prototypicalType, Declarations)
    for (const [key, defined] of keys) {
      Associated.lookupCopy(type, prototypicalType, MemberHostLookup, key)
      if (!defined) continue
      Associated.mapCopy(type, prototypicalType, MemberHostMap, key)
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
    yield* Associated.lookupGet(
      prototypicalType, MemberHostLookup, key) ?? [ type ]
  }
  static getMemberHost(type, key) {
    // returns map: key => partial class that defined the key
    const prototypicalType = PCReflect.#getPrototypicalType(type)
    if (!(key in prototypicalType.prototype)) return null
    return Associated.mapGet(
      prototypicalType, MemberHostMap, key) || type
  }
}

const PCReflect = PartialClassReflect
