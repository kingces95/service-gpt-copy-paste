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
    if (fn instanceof Es6Info) fn = fn.ctor
    assert(typeof fn == 'function', 'fn must be a function')

    if (!FunctionInfoCache.has(fn))
      FunctionInfoCache.set(fn, Info.#from(fn))

    return FunctionInfoCache.get(fn)
  }
  static #from(fn) {
    if (fn == PartialObject) return new PartialObjectInfo(fn)
    if (fn == PartialPojo) return new PartialObjectInfo(fn)
    if (fn == PartialClass) return new PartialObjectInfo(fn)
    if (fn == Concept) return new PartialObjectInfo(fn)

    const collectionType = PartialReflect.getPartialObjectType(fn)
    if (collectionType == PartialPojo) return new PartialPojoSubclassInfo(fn)
    if (collectionType == PartialClass) return new PartialClassSubclassInfo(fn)
    if (collectionType == Concept) return new ConceptSubclassInfo(fn)
        
    return new ClassInfo(fn)
  }
}

export class FunctionInfo extends Info {

  #es6ClassInfo

  constructor(type) {
    super()
    this.#es6ClassInfo = Es6Info.from(type)
  }

  #memberFilter(es6Member) {
    if (!es6Member) return false
    if (!this.isAbstract) return true
    if (es6Member.isKnown) return false
    if (es6Member.isStatic && this.isKnown) return false
    return true
  }
  #getMember(es6Member) {
    if (!this.#memberFilter(es6Member)) return null
    return MemberInfo.from$(es6Member)
  }
  *#members(es6Members) {
    for (const es6Member of es6Members) {
      const member = this.#getMember(es6Member)
      if (!member) continue
      yield member
    }
  }

  get md$() { return this.#es6ClassInfo }

  get ctor() { return this.md$.ctor }
  get id() { return this.md$.id }
  get name() { return this.id.value }
  get base() { 
    const base = Info.from(this.md$.base?.ctor)
    if (!this.isAbstract) return base
    if (base == Info.Object) return null
    return base
  }

  get isKnown() { 
    if (this == Info.PartialObject) return true
    if (this == Info.PartialPojo) return true
    if (this == Info.PartialClass) return true
    if (this == Info.Concept) return true
    return this.#es6ClassInfo.isKnown 
  }
  get isNonPublic() { return this.md$.isNonPublic }
  get isAbstract() { return this instanceof PartialObjectInfo }
  get isAnonymous() { return this.id.isAnonymous }
  get isTransparentPartialObject() { return this.isPartialPojoSubClass }

  get isPartialClassSubclass() { return this instanceof PartialClassSubclassInfo }
  get isPartialPojoSubClass() { return this instanceof PartialPojoSubclassInfo }
  get isConceptSubclass() { return this instanceof ConceptSubclassInfo }

  isSubclassOf(other) {
    assert(other instanceof FunctionInfo, 'other must be a FunctionInfo')

    let current = this
    while (current = current.base)
      if (current.equals(other)) return true
    return false
  }

  getOwnStaticMember(key) {
    const es6ClassInfo = this.#es6ClassInfo
    const es6Member = es6ClassInfo.getOwnStaticMember(key)
    return this.#getMember(es6Member)
  }
  getOwnInstanceMember(key) {
    const es6ClassInfo = this.#es6ClassInfo
    const es6Member = es6ClassInfo.getOwnInstanceMember(key)
    return this.#getMember(es6Member)
  }

  getStaticMember(key) {
    const es6ClassInfo = this.#es6ClassInfo
    const es6Member = es6ClassInfo.getStaticMember(key)
    return this.#getMember(es6Member)
  }
  getInstanceMember(key) {
    const es6ClassInfo = this.#es6ClassInfo
    const es6Member = es6ClassInfo.getInstanceMember(key)
    return this.#getMember(es6Member)
  }

  *ownInstanceMembers() {
    const es6ClassInfo = this.#es6ClassInfo
    const members = [...es6ClassInfo.ownInstanceMembers()]
    yield *this.#members(members)
  }
  *ownStaticMembers() {
    const es6ClassInfo = this.#es6ClassInfo
    const members = [...es6ClassInfo.ownStaticMembers()]
    yield *this.#members(members)
  }
  *ownMembers() {
    yield *this.ownStaticMembers()
    yield *this.ownInstanceMembers()
  }

  *instanceMembers() {
    const es6ClassInfo = this.#es6ClassInfo
    const members = [...es6ClassInfo.instanceMembers()]
    yield *this.#members(members)
  }
  *staticMembers() {
    const es6ClassInfo = this.#es6ClassInfo
    const members = [...es6ClassInfo.staticMembers()]
    yield *this.#members(members)
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
    const concepts = [...ConceptReflect.associatedConcepts(fn)]
    yield *concepts.map(([name, concept]) => [name, Info.from(concept)])
  }
  *ownAssociatedConcepts() {
    const fn = this.ctor
    const concepts = [...ConceptReflect.ownAssociatedConcepts(fn)]
    yield *concepts.map(([name, concept]) => [name, Info.from(concept)])
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

  toString() { return `[classInfo ${this.id.toString()}]` }
}
export class PartialObjectInfo extends FunctionInfo { 
  #_
  #es6ClassInfo

  constructor(type) {
    super(PartialReflect.getPrototypicalType$(type))
    this.#es6ClassInfo = Es6Info.from(type)
    this.#_ = this.toString()
  }

  get md$() { return this.#es6ClassInfo }

  toString() { return `[classInfo ${this.id.toString()}]` }
}
export class PartialPojoSubclassInfo extends PartialObjectInfo {
  constructor(type) {
    assert(type.prototype instanceof PartialPojo)
    super(type)
  }
  toString() { return `[partialPojoInfo]` }
}
export class PartialClassSubclassInfo extends PartialObjectInfo {
  constructor(type) {
    assert(type.prototype instanceof PartialClass)
    super(type)
  }
  toString() { return `[partialClassInfo ${this.id.toString()}]` }
}
export class ConceptSubclassInfo extends PartialObjectInfo {
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
Info.PartialPojo = Info.from(PartialPojo)
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
    if (this.isStatic) return null
    const fn = this.host.ctor
    const partialClass = PartialClassReflect.getPartialClass(fn, this.name)
    return Info.from(partialClass)
  }

  get isConceptual() {
    if (this.isStatic) return false
    return this.concepts().next().done == false
      //|| this.host.isConceptSubclass
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
  rootHost() { return FunctionInfo.from(this.#es6MemberInfo.rootHost()) }

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
