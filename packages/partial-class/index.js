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
  ownAssociatedTypes,
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

// A PartialClass can define a number of static hooks. Each hook has its 
// own symbol: Compile.  

// Compile transforms a descriptor before being copied to the target type. 
// For example, a concept partial type can apply a policy that all its 
// members are "abstract" by setting all get/set/value to abstract for 
// non-data members. Compile is called with the descriptor and returns 
// a descriptor.
const Compile = Symbol('PartialClass.compile')

// OwnDeclarationSymbols describes how types are associated with the
// PartialClass so that the poset of associated types can be traversed.
const OwnDeclarationSymbols = Symbol('PartialClass.ownDeclaraitionSymbols')

// The loader associates the following with the types it loads:
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

export class AnonymousPartialClass extends PartialClass { }

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
  
  // getPartialClass returns the type's PartialClass, or null if the type
  // does not extend PartialClass indirectly by exactly one level.
  // For example, if type extends Extension, which extends PartialClass,
  // then getPartialClass(type) returns Extension.
  static getPartialClass(type) {
    const partialClass = Object.getPrototypeOf(type)

    // Extension or Concept must extend PartialClass indirectly 
    // by exactly one level
    if (Object.getPrototypeOf(partialClass) != PartialClass)
      return null

    return partialClass
  }
  static isPartialClass(type) {
    return !!PCReflect.getPartialClass(type)
  }

  static *ownDeclarations(type, { filterType } = { }) {
    if (PCReflect.isPartialClass(type)) {
      yield* ownAssociatedTypes(type, 
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
        PartialClassReflect.getMemberDescriptors(prototypicalType))
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

    if (isPojo(partialType)) partialType = PCReflect.fromPojo(partialType)

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

  static fromPojo(pojo) {
    const [type] = [class extends AnonymousPartialClass { }]
    const prototype = type.prototype

    for (const key of ownMemberNamesAndSymbols(pojo)) {
      const descriptor = Object.getOwnPropertyDescriptor(pojo, key)
      Object.defineProperty(prototype, key, descriptor)
    }

    return type
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

// Design Goals:
// Partial classes are an extension of Object.defineProperties where the
// descriptors can be a pojo as usual but also as a pojo that contains
// lambdas or as classes that form trees of partial classes. To verify 
// the shape of the resulting class a reflection API is provided. That API
// can choose to reconstruct the loader or the loader can leave artifacts
// that the loader consumes. The former is more isolated but the latter is
// more accurate because it captures exactly what the loader did instead of
// trying to simulate it. 