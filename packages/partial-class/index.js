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
// own symbol: Compile, PreCondition, and PostCondition.  

// Compile transforms a descriptor before being copied to the target type. 
// For example, a concept partial type can apply a policy that all its 
// members are "abstract" by setting all get/set/value to abstract for 
// non-data members. Compile is called with the descriptor and returns 
// a descriptor.
const Compile = Symbol('PartialClass.compile')

// PreCondition allows the PartialClass to enforce a pre-condition before any
// members are applied. This is not guaranteed to be called if a non-debug 
// version of the code is used. PreCondition is called with the type 
// and returns void.
const PreCondition = Symbol('PartialClass.preCondition')

// PostCondition allows the PartialClass to enforce a post-condition after the
// partial type as been applied. This is not guaranteed to be called if
// a non-debug version of the code is used. PostCondition is called with
// the type and returns void.
const PostCondition = Symbol('PartialClass.postCondition')

// OwnDeclarationSymbols describes how types are associated with the
// PartialClass. PartialClass defines its own sense of hierarchy this way.
const OwnDeclarationSymbols = Symbol('PartialClass.ownDeclaraitionSymbols')

// Declarations is a set on a client type to track which partial types
// have been applied to it via PartialClass.define or indirectly via
// calls to either extend() or implement(). 
const Declarations = Symbol('PartialClass.declarations')

const MemberHostLookup = Symbol('PartialClassReflect.memberHostLookup')
const MemberHostMap = Symbol('PartialClassReflect.memberHostMap')
const PrototypicalType = Symbol('PartialClassReflect.prototypicalType')
const Descriptors = Symbol('PartialClassReflect.descriptors')

export class PartialClass {
  static Symbol = {
    preCondition: PreCondition,
    ownDeclaraitionSymbols: OwnDeclarationSymbols,
    compile: Compile,
    postCondition: PostCondition,
  }

  constructor() {
    throw new TypeError('PartialClass cannot be instantiated.')
  }

  static [OwnDeclarationSymbols] = { }
  static [Compile](descriptor) { return Compiler.compile(descriptor) }
  static [PreCondition](type, host) { }
  static [PostCondition](type) { }
}

class PrototypicalPartialType { }

export class AnonymousPartialClass extends PartialClass { }

export class PartialClassReflect {

  static #getPrototypicalType(type) {
    if (!this.isPartialClass(type)) return type

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
      this.mergeMembers(prototypicalType, type)
      return prototypicalType
    })
  }  

  static getClassInfo(type) {
    if (!type) return null
    if (type instanceof Es6ClassInfo) return type
    return Es6ClassInfo.from(type)
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
    return !!this.getPartialClass(type)
  }

  static *ownDeclarations(type, { filterType } = { }) {
    if (this.isPartialClass(type)) {
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
    if (this.isPartialClass(type)) {
      const prototypicalType = this.#getPrototypicalType(type)
      yield* [...this.declarations(prototypicalType, 
        { filterType })].filter(declaration => declaration != type)
    }
    else {
      yield* associatedTypes(type, 
        { [Declarations]: { filterType } }, 
        { inherit: true })
    }
  }

  static *ownMemberKeys(type) { 
    if (this.isPartialClass(type)) {
      yield * [...this.memberKeys(type)].filter(key => 
        this.getMemberHost(type, key) == type)
    }
    else {
      yield* ownMemberNamesAndSymbols(type.prototype) 
    }
  }
  static *memberKeys(type) { 
    if (this.isPartialClass(type)) {
      const prototypicalType = this.#getPrototypicalType(type)
      yield* this.memberKeys(prototypicalType)    
    } 
    else {
      yield* memberNamesAndSymbols(type.prototype)
    }
  }

  static getOwnMemberDescriptor(type, key) {
    const prototype = type.prototype
    const descriptor = Object.getOwnPropertyDescriptor(prototype, key)
    if (!this.isPartialClass(type)) return descriptor
    return type[Compile](descriptor) 
  }
  static getMemberDescriptor(type, key) {
    const prototypicalType = this.#getPrototypicalType(type)
    return Object.getOwnPropertyDescriptor(prototypicalType.prototype, key)
  }

  static getOwnMemberDescriptors(type) {
    const descriptors = { }
    for (const key of ownMemberNamesAndSymbols(type.prototype))
      descriptors[key] = this.getOwnMemberDescriptor(type, key)
    return descriptors
  }
  static getMemberDescriptors(type) {
    if (this.isPartialClass(type)) {
      const prototypicalType = this.#getPrototypicalType(type)
      return associatedObject(type, Descriptors, () => 
        PartialClassReflect.getMemberDescriptors(prototypicalType))
    }
    else {
      const descriptors = { }
      for (const key of this.memberKeys(type))
        descriptors[key] = this.getMemberDescriptor(type, key)
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
      const defined = this.defineMember(type, key, descriptors[key])
      keys.push([key, defined])
    }
    return keys
  }

  static verifyPartialClass(partialType) {
    if (!this.isPartialClass(partialType))
      throw `PartialClass must indirectly extend PartialClass.`

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

    const prototypicalType = this.#getPrototypicalType(partialType)
    associatedSetCopy(type, prototypicalType, Declarations)
    for (const [key, defined] of keys) {
      associatedLookupCopy(type, prototypicalType, MemberHostLookup, key)
      if (!defined) continue
      associatedMapCopy(type, prototypicalType, MemberHostMap, key)
    }
  }
  static mergeMembers(type, partialType) {
    this.verifyPartialClass(partialType)

    if(this.isPartialClass(type)) 
      throw `Expected type '${type.name}' not to be a PartialClass.`

    partialType[PreCondition](type)

    for (const declaration of this.ownDeclarations(partialType)) {
      const descriptors = this.getMemberDescriptors(declaration)
      const keys = this.defineMembers(type, descriptors)
      if (!(declaration.prototype instanceof AnonymousPartialClass))
        this.mergeAssociations$(type, declaration, keys)
      else
        this.associate$(type, partialType, keys)
    }

    const descriptors = this.getOwnMemberDescriptors(partialType)
    const keys = this.defineMembers(type, descriptors)
    if (!(partialType.prototype instanceof AnonymousPartialClass))
      this.associate$(type, partialType, keys)

    partialType[PostCondition](type)
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
    const prototypicalType = this.#getPrototypicalType(type)
    if (!(key in prototypicalType.prototype)) return null
    yield* associatedLookupGet(
      prototypicalType, MemberHostLookup, key) ?? [ type ]
  }
  
  static getMemberHost(type, key) {
    // returns map: key => partial class that defined the key
    const prototypicalType = this.#getPrototypicalType(type)
    if (!(key in prototypicalType.prototype)) return null
    return associatedMapGet(
      prototypicalType, MemberHostMap, key) || type
  }
}

// Design Goals:
// Partial classes are an extension of Object.defineProperties where the
// descriptors can be a pojo as usual but also as a pojo that contains
// lambdas or as classes that form trees of partial classes. To verify 
// the shape of the resulting class a reflection API is provided. That API
// can choose to reconstruct the loader or the loader can leave artifacts
// that the loader consumes. The former is more isolated but the latter is
// more accurate because it captures exactly what the loader did instead of
// trying to simulate it. 