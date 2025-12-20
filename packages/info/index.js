import { assert } from '@kingjs/assert'
import { isAbstract } from "@kingjs/abstract"
import { PartialPojo } from '@kingjs/partial-pojo'
import { PartialObject } from '@kingjs/partial-object'
import { PartialReflect } from '@kingjs/partial-reflect'
import { Es6Info, Es6MemberInfo } from "@kingjs/es6-info"
import { Concept, ConceptReflect } from "@kingjs/concept"
import { PartialClass, PartialClassReflect } from '@kingjs/partial-class'

export class Info {
  static from(fn) {
    if (!fn) return null
    assert(typeof fn == 'function', 'fn must be a function')

    if (fn == PartialObject) return new PartialObjectInfo(fn)
    if (fn == PartialPojo) return new PartialObjectInfo(fn)
    if (fn == PartialClass) return new PartialObjectInfo(fn)
    if (fn == Concept) return new PartialObjectInfo(fn)

    const collectionType = PartialReflect.getPartialObjectType(fn)
    if (collectionType == PartialPojo) return new PartialPojoInfo(fn)
    if (collectionType == PartialClass) return new PartialClassInfo(fn)
    if (collectionType == Concept) return new ConceptInfo(fn)  
    return new ClassInfo(fn)
  }
}

export class FunctionInfo extends Info {

  static getStaticMember(type, key) {
    assert(type instanceof FunctionInfo, 'type must be a FunctionInfo')
    return type.getStaticMember(key)
  }
  static getInstanceMember(type, key) {
    assert(type instanceof FunctionInfo, 'type must be a FunctionInfo')
    return type.getInstanceMember(key)
  }

  static *instanceMembers(type) {
    assert(type instanceof FunctionInfo, 'type must be a FunctionInfo')
    yield *type.instanceMembers()
  }
  static *staticMembers(type) {
    assert(type instanceof FunctionInfo, 'type must be a FunctionInfo')
    yield *type.staticMembers()
  }
  static *members(type) {
    assert(type instanceof FunctionInfo, 'type must be a FunctionInfo')
    yield *type.members()
  }

  static *concepts(type) {
    assert(type instanceof FunctionInfo, 'type must be a FunctionInfo')
    yield *type.concepts()
  }
  static *extensionGroups(type) {
    assert(type instanceof FunctionInfo, 'type must be a FunctionInfo')
    yield *type.extensionGroups()
  }

  #ctor
  #es6ClassInfo

  constructor(type) {
    super()
    const prototypicalType = PartialReflect.getPrototypicalType$(type)
    this.#es6ClassInfo = Es6Info.from(prototypicalType)
    this.#ctor = type
  }

  get isObject$() { return this.#es6ClassInfo.isObject$ }
  get base$() { return Info.from(this.#es6ClassInfo.base?.ctor) }
  get id$() { return this.#es6ClassInfo.id }
  get isTransparentPartialObject$() { return false }

  get ctor() { return this.#ctor }
  get name() { return this.id.value }
  get id() { return this.id$ }
  get isAnonymous() { return this.id.isAnonymous }
  get base() { return this.base$ }
  get isNonPublic() { return this.#es6ClassInfo.isNonPublic }

  get isPartialObject() { return this instanceof KnownPartialClassInfo }
  get isTransparentPartialObject() { return this.isTransparentPartialObject$ }
  get isPartialClass() { return this instanceof PartialClassInfo }
  get isPartialPojo() { return this instanceof PartialPojoInfo }
  get isConcept() { return this instanceof ConceptInfo }

  *ownExtensionGroups() {
    const groups = [...PartialClassReflect.ownExtensionGroups(this.ctor)]
    yield *groups.map(group => Info.from(group))
  }
  *ownConcepts() {
    const concepts = [...ConceptReflect.ownConcepts(this.ctor)]
    yield *concepts.map(concept => Info.from(concept))
  }

  *ownInstanceMembers() {
    const es6ClassInfo = this.#es6ClassInfo
    const members = [...es6ClassInfo.ownInstanceMembers()]
    yield *members.filter(this.filter$).map(member => MemberInfo.from$(member))
  }
  *ownStaticMembers() {
    const es6ClassInfo = this.#es6ClassInfo
    const members = [...es6ClassInfo.ownStaticMembers()]
    yield *members.filter(this.filter$).map(member => MemberInfo.from$(member))
  }
  *ownMembers() {
    yield *this.ownStaticMembers()
    yield *this.ownInstanceMembers()
  }

  getOwnInstanceMember(key) {
    const es6ClassInfo = this.#es6ClassInfo
    const member = es6ClassInfo.getOwnInstanceMember(key)
    if (!this.filter$(member)) return null
    return MemberInfo.from$(member)
  }
  getOwnStaticMember(key) {
    const es6ClassInfo = this.#es6ClassInfo
    const member = es6ClassInfo.getOwnStaticMember(key)
    if (!this.filter$(member)) return null
    return MemberInfo.from$(member)
  }

  getStaticMember(key) {
    const es6ClassInfo = this.#es6ClassInfo
    const member = es6ClassInfo.getStaticMember(key)
    if (!this.filter$(member)) return null
    return MemberInfo.from$(member) 
  }
  getInstanceMember(key) {
    const es6ClassInfo = this.#es6ClassInfo
    const member = es6ClassInfo.getInstanceMember(key)
    if (!this.filter$(member)) return null
    return MemberInfo.from$(member) 
  }

  *instanceMembers() {
    const es6ClassInfo = this.#es6ClassInfo
    const members = [...es6ClassInfo.instanceMembers()]
    yield *members.filter(this.filter$).map(m => MemberInfo.from$(m))
  }
  *staticMembers() {
    const es6ClassInfo = this.#es6ClassInfo
    const members = [...es6ClassInfo.staticMembers()]
    yield *members.filter(this.filter$).map(m => MemberInfo.from$(m))
  }
  *members() {
    yield *this.staticMembers()
    yield *this.instanceMembers()
  }

  *concepts() {
    const fn = this.ctor
    const concepts = [...ConceptReflect.concepts(fn)]
    yield *concepts.map(concept => Info.from(concept))
  }
  *extensionGroups() {
    const fn = this.ctor
    const groups = [...PartialClassReflect.extensionGroups(fn)]
    yield *groups.map(group => Info.from(group))
  }

  equals(other) {
    if (!(other instanceof FunctionInfo)) return false
    return this.#es6ClassInfo.equals(other.#es6ClassInfo)
  }

  //[util.inspect.custom]() { return this.toString() }
}
export class ClassInfo extends FunctionInfo { 
  #_

  constructor(type) {
    super(type)
  
    this.#_ = this.toString()
  }

  filter$(member) { return true }

  toString() { return `[classInfo ${this.id.toString()}]` }
}
export class PartialFunctionInfo extends FunctionInfo {
  constructor(type) {
    assert(new.target !== PartialFunctionInfo)
    super(type)
  }
}
export class PartialObjectInfo extends PartialFunctionInfo {
  constructor(type) {
    assert(
      type === PartialObject
      || type == PartialPojo
      || type == PartialClass
      || type == Concept
    )

    super(type)
  }

  get base$() { 
    const base = super.base$
    if (base.isObject$) return null
    return base
  }

  filter$(member) { return false }
}
export class KnownPartialClassInfo extends PartialFunctionInfo { 
  #_
  #es6ClassInfo

  constructor(type) {
    assert(new.target != KnownPartialClassInfo)

    super(type)
    this.#es6ClassInfo = Es6Info.from(type)
    this.#_ = this.toString()
  }

  get base$() { return Info.from(this.#es6ClassInfo.base.ctor) }
  get id$() { return this.#es6ClassInfo.id }

  filter$(member) { return !member?.isKnown }
}
export class PartialPojoInfo extends KnownPartialClassInfo {
  constructor(type) {
    assert(type.prototype instanceof PartialPojo)
    super(type)
  }
  
  get isTransparentPartialObject$() { return true }

  toString() { return `[partialPojoInfo]` }
}
export class PartialClassInfo extends KnownPartialClassInfo {
  constructor(type) {
    assert(type.prototype instanceof PartialClass)
    super(type)
  }
  toString() { return `[partialClassInfo ${this.id.toString()}]` }
}
export class ConceptInfo extends KnownPartialClassInfo {
  constructor(type) {
    assert(type.prototype instanceof Concept)
    super(type)
  }
  toString() { return `[conceptInfo ${this.id.toString()}]` }
}

Info.Object = Info.from(Object)
Info.Function = Info.from(Function)
Info.Array = Info.from(Array)
Info.String = Info.from(String)
Info.Number = Info.from(Number)
Info.Boolean = Info.from(Boolean)
Info.PartialObject = Info.from(PartialObject)
Info.PartialObject = Info.from(PartialObject)
Info.PartialClass = Info.from(PartialClass)
Info.Concept = Info.from(Concept)

export class MemberInfo extends Info {
  static from$(es6MemberInfo) {
    if (!es6MemberInfo) return null

    assert(es6MemberInfo instanceof Es6MemberInfo, 
      'descriptor must be a Es6MemberInfo')
    
    if (es6MemberInfo.isAccessor) return new AccessorMemberInfo(es6MemberInfo)
    if (es6MemberInfo.isMethod) return new MethodMemberInfo(es6MemberInfo)
    return new DataMemberInfo(es6MemberInfo)
  }

  #_
  #es6MemberInfo

  constructor(es6MemberInfo) {
    super()
    this.#es6MemberInfo = es6MemberInfo
    this.#_ = this.toString()
  }

  get host() { 
    let host = this.#es6MemberInfo.host
    const fn = PartialReflect.getPrototypicalHost$(host.ctor)
    return Info.from(fn)
  }
  get name() { return this.#es6MemberInfo.name }
  get isKnown() { return this.#es6MemberInfo.isKnown }
  get isNonPublic() { return this.#es6MemberInfo.isNonPublic }

  get isAccessor() { return this.#es6MemberInfo.isAccessor }
  get isMethod() { return this.#es6MemberInfo.isMethod }
  get isData() { return this.#es6MemberInfo.isData }
  get isConstructor() { return this.#es6MemberInfo.isConstructor }
  get type() { return this.#es6MemberInfo.type }

  get isStatic() { return this.#es6MemberInfo.isStatic }

  get isEnumerable() { return this.#es6MemberInfo.isEnumerable }
  get isConfigurable() { return this.#es6MemberInfo.isConfigurable }
  get isWritable() { return this.#es6MemberInfo.isWritable }

  get hasGetter() { return this.#es6MemberInfo.hasGetter }
  get hasSetter() { return this.#es6MemberInfo.hasSetter }
  get hasValue() { return this.#es6MemberInfo.hasValue }

  get getter() { return this.#es6MemberInfo.getter }
  get setter() { return this.#es6MemberInfo.setter }
  get value() { return this.#es6MemberInfo.value }

  get isAbstract() { 
    const { descriptorInfo } = this.#es6MemberInfo
    const { descriptor } = descriptorInfo
    return isAbstract(descriptor)
  }
  
  get extensionGroup() {
    return Info.from(
      PartialClassReflect.getExtensionGroup(this.host.ctor, this.name))
  }

  get isConceptual() {
    for (const concept of this.concepts()) return true
    return false
  }
  *concepts() {
    if (this.isStatic) return

    // Concepts can be declared on any member of the type hierarchy. 
    // Walk the hierarchy to find them and maintain a set to avoid duplicates.
    const seen = new Set()

    // Use .parent to walk the member hierarchy
    const host = this.host
    for (let member = this; member; member = member.parent()) {
      const fn = member.host.ctor
      for (const concept of ConceptReflect.getConceptHosts(fn, member.name)) {
        if (concept == host.ctor) continue
        seen.add(concept)
      }
    }

    // Map to Info instances
    yield *[...seen].map(fn => Info.from(fn))
  }

  parent() { return MemberInfo.from$(this.#es6MemberInfo.parent()) }
  root() { return MemberInfo.from$(this.#es6MemberInfo.root()) }
  rootHost() { return FunctionInfo.from(this.#es6MemberInfo.rootHost()?.ctor) }

  equals(other) {
    if (!(other instanceof MemberInfo)) return false
    return this.#es6MemberInfo.equals(other.#es6MemberInfo)
  }

  toString() { 
    return this.#es6MemberInfo.toString({
      modifiers: [ this.isAbstract ? 'abstract' : null ],
      host: this.host
    })
  }
}
export class AccessorMemberInfo extends MemberInfo { }
export class ValueMemberInfo extends MemberInfo { }
export class MethodMemberInfo extends ValueMemberInfo { }
export class DataMemberInfo extends ValueMemberInfo { }
