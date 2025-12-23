import { assert } from '@kingjs/assert'
import { isAbstract } from "@kingjs/abstract"
import { PartialPojo } from '@kingjs/partial-pojo'
import { PartialObject } from '@kingjs/partial-object'
import { PartialReflect } from '@kingjs/partial-reflect'
import { Es6Info, Es6MemberInfo } from "@kingjs/es6-info"
import { Concept, ConceptReflect } from "@kingjs/concept"
import { PartialClass, PartialClassReflect } from '@kingjs/partial-class'

const FunctionInfoCache = new WeakMap()

export class Info {
  static from(fn) {
    if (!fn) return null
    assert(typeof fn == 'function', 'fn must be a function')

    if (!FunctionInfoCache.has(fn))
      FunctionInfoCache.set(fn, Info.#from(fn))

    return FunctionInfoCache.get(fn)
  }
  static #from(fn) {
    if (fn == PartialObject) return new KnownPartialObjectInfo(fn)
    if (fn == PartialPojo) return new KnownPartialObjectInfo(fn)
    if (fn == PartialClass) return new KnownPartialObjectInfo(fn)
    if (fn == Concept) return new KnownPartialObjectInfo(fn)

    const collectionType = PartialReflect.getPartialObjectType(fn)
    if (collectionType == PartialPojo) return new PartialPojoInfo(fn)
    if (collectionType == PartialClass) return new PartialClassInfo(fn)
    if (collectionType == Concept) return new ConceptInfo(fn)  
    return new ClassInfo(fn)
  }
}

export class FunctionInfo extends Info {

  #es6ClassInfo

  constructor(type) {
    super()
    const prototypicalType = PartialReflect.getPrototypicalType$(type)
    this.#es6ClassInfo = Es6Info.from(prototypicalType)
  }

  get md$() { return this.#es6ClassInfo }
  get isObject$() { return this.#es6ClassInfo.isObject$ }
  get isTransparentPartialObject$() { return false }

  get ctor() { return this.md$.ctor }
  get id() { return this.md$.id }
  get name() { return this.id.value }
  get base() { 
    const base = Info.from(this.md$.base?.ctor)
    if (this.isAbstract && base.isObject$) return null
    return base
  }

  get isAbstract() { return this instanceof AbstractFunctionInfo }
  get isAnonymous() { return this.id.isAnonymous }
  get isNonPublic() { return this.#es6ClassInfo.isNonPublic }
  get isTransparentPartialObject() { return this.isTransparentPartialObject$ }

  get isPartialClassSubclass() { return this instanceof PartialClassInfo }
  get isPartialPojoSubClass() { return this instanceof PartialPojoInfo }
  get isConceptSubclass() { return this instanceof ConceptInfo }

  isSubclassOf(other) {
    assert(other instanceof FunctionInfo, 'other must be a FunctionInfo')

    let current = this
    while (current = current.base)
      if (current.equals(other)) return true
    return false
  }

  getOwnStaticMember(key) {
    const es6ClassInfo = this.#es6ClassInfo
    const member = es6ClassInfo.getOwnStaticMember(key)
    if (!this.filter$(member)) return null
    return MemberInfo.from$(member)
  }
  getOwnInstanceMember(key) {
    const es6ClassInfo = this.#es6ClassInfo
    const member = es6ClassInfo.getOwnInstanceMember(key)
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

  *ownPartialClasses() {
    const groups = [...PartialClassReflect.ownPartialClasses(this.ctor)]
    yield *groups.map(group => Info.from(group))
  }
  *ownConcepts() {
    const concepts = [...ConceptReflect.ownConcepts(this.ctor)]
    yield *concepts.map(concept => Info.from(concept))
  }

  *partialClasses() {
    const fn = this.ctor
    const groups = [...PartialClassReflect.partialClasses(fn)]
    yield *groups.map(group => Info.from(group))
  }
  *concepts() {
    const fn = this.ctor
    const concepts = [...ConceptReflect.concepts(fn)]
    yield *concepts.map(concept => Info.from(concept))
  }

  *associatedConcepts() {
    const fn = this.ctor
    for (const concept of ConceptReflect.associatedConcepts(fn))
      yield Info.from(concept)
  }
  *ownAssociatedConcepts() {
    const fn = this.ctor
    for (const concept of ConceptReflect.ownAssociatedConcepts(fn))
      yield Info.from(concept)
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
export class AbstractFunctionInfo extends FunctionInfo {
  constructor(type) {
    assert(new.target !== AbstractFunctionInfo)
    super(type)
  }
}
export class KnownPartialObjectInfo extends AbstractFunctionInfo {
  constructor(type) {
    assert(
      type === PartialObject
      || type == PartialPojo
      || type == PartialClass
      || type == Concept
    )

    super(type)
  }

  filter$(member) { return false }

  toString() { return `[knownPartialObjectInfo ${this.id.toString()}]` }
}
export class PartialObjectInfo extends AbstractFunctionInfo { 
  #_
  #es6ClassInfo

  constructor(type) {
    assert(new.target != PartialObjectInfo)

    super(type)
    this.#es6ClassInfo = Es6Info.from(type)
    this.#_ = this.toString()
  }

  get md$() { return this.#es6ClassInfo }

  filter$(member) { return !member?.isKnown }
}
export class PartialPojoInfo extends PartialObjectInfo {
  constructor(type) {
    assert(type.prototype instanceof PartialPojo)
    super(type)
  }
  
  get isTransparentPartialObject$() { return true }

  toString() { return `[partialPojoInfo]` }
}
export class PartialClassInfo extends PartialObjectInfo {
  constructor(type) {
    assert(type.prototype instanceof PartialClass)
    super(type)
  }
  toString() { return `[partialClassInfo ${this.id.toString()}]` }
}
export class ConceptInfo extends PartialObjectInfo {
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
  
  get partialClass() {
    return Info.from(
      PartialClassReflect.getPartialClass(this.host.ctor, this.name))
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

export class AssociatedConceptInfo extends Info {
  static from$(concept) {
    if (!concept) return null
    assert(typeof concept == 'function', 'concept must be a function')
    assert(ConceptReflect.isConcept(concept), 'concept must be a Concept')
    return new AssociatedConceptInfo(concept.name, concept)
  }

  #name
  #concpt

  constructor(name, concept) {
    super()
    this.#name = name
    this.#concpt = concept
  }

  get name() { return this.#name }
  get concept() { return Info.from(this.#concpt) }

  toString() {
    return `${this.concept.toString()}, [associatedConceptInfo ${this.name}]`
  }
}