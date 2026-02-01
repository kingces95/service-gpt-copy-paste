import { assert } from '@kingjs/assert'
import { es6BaseType } from '@kingjs/es6-base-type'
import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { InfoReflect } from '@kingjs/info-reflect'
import { PartialPojo } from '@kingjs/partial-pojo'
import { Concept } from "@kingjs/concept"
import { PartialClass } from '@kingjs/partial-class'
import { 
  PartialType, 
  PartialTypeReflect 
} from '@kingjs/partial-type'
import { 
  Es6ClassInfo, 
  Es6MemberInfo,
  Es6IdInfo,
  Es6KeyInfo,
  Es6DescriptorInfo,
} from "@kingjs/es6-info"

const FunctionInfoCache = new WeakMap()

export class Info {

  static from(fn) {
    if (!fn) return null
    if (fn instanceof Es6ClassInfo) fn = fn.ctor
    assert(typeof fn == 'function', 'fn must be a function')

    if (!FunctionInfoCache.has(fn))
      FunctionInfoCache.set(fn, Info.#from(fn))

    return FunctionInfoCache.get(fn)
  }
  static #from(fn) {
    const idInfo = Es6IdInfo.create(fn.name)

    if (fn == PartialType) return new PartialTypeInfo(fn, idInfo)
    if (fn == PartialPojo) return new PartialTypeInfo(fn, idInfo)
    if (fn == PartialClass) return new PartialTypeInfo(fn, idInfo)
    if (fn == Concept) return new PartialTypeInfo(fn, idInfo)

    const collectionType = 
      PartialTypeReflect.getPartialType(fn, idInfo)
    if (collectionType == PartialPojo) return new PartialPojoInfo(fn, idInfo)
    if (collectionType == PartialClass) return new PartialClassInfo(fn, idInfo)
    if (collectionType == Concept) return new ConceptInfo(fn, idInfo)

    return new ClassInfo(fn, idInfo)
  }
}

export class TypeInfo extends Info {

  #_
  #idInfo
  #fn

  constructor(type, idInfo) {
    super()
    this.#fn = type
    this.#idInfo = idInfo
    this.#_ = this.toString()
  }

  #createMember(fn, key, descriptor, { isStatic } = { }) {
    return MemberInfo.from$(fn, key, descriptor, { isStatic })
  }

  get ctor() { return this.#fn }
  get id() { return this.#idInfo }
  get name() { return this.id.value }
  get base() { 
    const base = Info.from(es6BaseType(this.ctor)) 
    if (!this.isAbstract) return base
    if (base == Info.Object) return null
    return base
  }

  get isKnown() { return InfoReflect.isKnown(this.ctor) }
  get isNonPublic() { return this.id.isNonPublic }
  get isAbstract() { return this instanceof PartialTypeInfo }
  get isAnonymous() { return this.id.isAnonymous }
  get isTransparentPartialObject() { return this.isPartialPojoSubClass }

  get isPartialClassSubclass() { return this instanceof PartialClassInfo }
  get isPartialPojoSubClass() { return this instanceof PartialPojoInfo }
  get isConceptSubclass() { return this instanceof ConceptInfo }

  isSubclassOf(other) {
    assert(other instanceof TypeInfo, 'other must be a TypeInfo')

    let current = this
    while (current = current.base)
      if (current.equals(other)) return true
    return false
  }

  getOwnMember(key, { isStatic } = { }) {
    const fn = this.ctor
    const descriptor = InfoReflect.getOwnDescriptor(fn, key, { isStatic })
    if (!descriptor) return null
    return this.#createMember(fn, key, descriptor, { isStatic })
  }
  getMember(key, { isStatic } = { }) {
    const fn = this.ctor
    let owner, descriptor
    for (const current of InfoReflect.getDescriptor(fn, key, { isStatic })) {
      switch (typeof current) {
        case 'function': owner = current; break
        case 'object': descriptor = current; break
        default: assert(false, `Unexpected type: ${typeof current}`)
      }
    }
    if (!descriptor) return null
    return this.#createMember(owner, key, descriptor, { isStatic })
  }
  *ownMembers({ isStatic } = { }) {
    const fn = this.ctor
    let key
    for (const current of InfoReflect.ownDescriptors(fn, { isStatic })) {
      switch (typeof current) {
        case 'string':
        case 'symbol': key = current; break
        case 'object':
          yield this.#createMember(fn, key, current, { isStatic })
          break
        default: assert(false, `Unexpected type: ${typeof current}`)
      }
    }
  }
  *members({ isStatic } = { }) {
    const fn = this.ctor
    let owner, key
    for (const current of InfoReflect.descriptors(fn, { isStatic })) {
      switch (typeof current) {
        case 'function': owner = current; break
        case 'string':
        case 'symbol': key = current; break
        case 'object': {
          yield this.#createMember(owner, key, current, { isStatic })
          continue
        }
        default: assert(false, `Unexpected type: ${typeof current}`)
      }
    }
  }

  getOwnStaticMember(key) { return this.getOwnMember(key, { isStatic: true }) }
  getStaticMember(key) { return this.getMember(key, { isStatic: true }) }
  *ownStaticMembers() { yield* this.ownMembers({ isStatic: true }) }
  *staticMembers() { yield* this.members({ isStatic: true }) }

  // partial classes
  *ownPartialClasses() {
    yield *InfoReflect.ownPartialClasses(this.ctor)
      .map(partialClass => Info.from(partialClass))
  }
  *partialClasses() {
    yield *InfoReflect.partialClasses(this.ctor)
      .map(partialClass => Info.from(partialClass))
  }

  // concepts
  *ownConcepts() {
    yield *InfoReflect.ownConcepts(this.ctor)
      .map(concept => Info.from(concept))
  }
  *concepts() {
    yield *InfoReflect.concepts(this.ctor)
      .map(concept => Info.from(concept))
  }
  *ownAssociatedConcepts() {
    yield* InfoReflect.ownAssociatedConcepts(this.ctor)
      .map(([name, concept]) => [name, Info.from(concept)])
  }
  *associatedConcepts() {
    yield* InfoReflect.associatedConcepts(this.ctor)
      .map(([name, concept]) => [name, Info.from(concept)])
  }

  equals(other) { return this == other }

  //[util.inspect.custom]() { return this.toString() }
}
export class ClassInfo extends TypeInfo { 
  toString() { return `[classInfo ${this.id.toString()}]` }
}
export class PartialTypeInfo extends TypeInfo { 
  toString() { return `[classInfo ${this.id.toString()}]` }
}
export class PartialPojoInfo extends PartialTypeInfo {
  constructor(type, idInfo) {
    assert(type.prototype instanceof PartialPojo)
    super(type, idInfo)
  }
  toString() { return `[partialPojoInfo]` }
}
export class PartialClassInfo extends PartialTypeInfo {
  constructor(type, idInfo) {
    assert(type.prototype instanceof PartialClass)
    super(type, idInfo)
  }
  toString() { return `[partialClassInfo ${this.id.toString()}]` }
}
export class ConceptInfo extends PartialTypeInfo {
  constructor(type, idInfo) {
    assert(type.prototype instanceof Concept)
    super(type, idInfo)
  }
  toString() { return `[conceptInfo ${this.id.toString()}]` }
}

Info.Object = Info.from(Object)
Info.Function = Info.from(Function)
Info.Array = Info.from(Array)
Info.String = Info.from(String)
Info.Number = Info.from(Number)
Info.Boolean = Info.from(Boolean)
Info.PartialType = Info.from(PartialType)
Info.PartialPojo = Info.from(PartialPojo)
Info.PartialClass = Info.from(PartialClass)
Info.Concept = Info.from(Concept)

export class MemberInfo extends Info {
  static from$(fn, key, descriptor, { isStatic } = { }) {
    const type = InfoReflect.typeof(fn, key, descriptor, { isStatic })
    const keyInfo = Es6KeyInfo.create(key)
    const descriptorInfo = Es6DescriptorInfo.create(descriptor)
    const host = Info.from(fn)

    return new MemberInfo(
      host, keyInfo, descriptorInfo, { isStatic, type })
  }

  #_
  #host
  #type
  #keyInfo
  #descriptorInfo
  #isStatic
  
  constructor(host, keyInfo, descriptorInfo, { 
    isStatic, type } = { }) {
    super()
    this.#host = host
    this.#keyInfo = keyInfo
    this.#descriptorInfo = descriptorInfo
    this.#isStatic = !!isStatic
    this.#type = type

    this.#_ = this.toString()
  }

  get #isEnumerable() { return this.#descriptorInfo.isEnumerable }
  get #isConfigurable() { return this.#descriptorInfo.isConfigurable }
  get #isWritable() { return this.#descriptorInfo.isWritable }

  get name() { return this.#keyInfo.value }
  get keyInfo() { return this.#keyInfo }

  get host() { return this.#host }
  get fieldType() { 
    if (!this.isField) return null
    return this.#descriptorInfo.fieldType 
  }
  
  // pivots
  get isStatic() { return this.#isStatic }
  get isKnown() { return false }
  get isNonPublic() { return this.#keyInfo.isNonPublic }
  get isAbstract() { return this.#descriptorInfo.isAbstract }
  
  // member type
  get type() { return this.#type }
  get isConstructor() { return this.type == 'constructor' }
  get isMethod() { return this.type == 'method' }
  get isField() { return this.type == 'field' }
  get isProperty() { return this.type == 'property' }
  get isGetter() { return this.type == 'getter' }
  get isSetter() { return this.type == 'setter' }  

  // member modifiers
  get isVisible() { return this.#isEnumerable }
  get isHidden() { return !this.isVisible }
  get isSealed() { return !this.#isConfigurable }
  get isConst() { return !this.isAccessor && !this.#isWritable }

  // member values
  get getter() { return this.#descriptorInfo.getter }
  get setter() { return this.#descriptorInfo.setter }
  get value() { return this.#descriptorInfo.value }
  get method() { return this.#descriptorInfo.value }
  get ctor() { return this.#descriptorInfo.value }
  
  // member type groups
  get isAccessor() { return this.isGetter || this.isSetter || this.isProperty }
  get isFunction() { return this.isMethod || this.isConstructor }

  // descriptor
  get descriptorInfo() { return this.#descriptorInfo }

  parent() { 
    const parent = this.host.base
    if (!parent) return null

    const isStatic = this.isStatic
    return parent.getOwnMember(this.name, { isStatic })
  }

  equals(other) {
    if (!(other instanceof MemberInfo)) return false
    if (this.#isStatic !== other.#isStatic) return false
    if (!this.#host.equals(other.#host)) return false
    if (!this.#descriptorInfo.equals(other.#descriptorInfo)) return false
    if (!this.#keyInfo.equals(other.#keyInfo)) return false
    return true  
  }

  get partialClass() {
    if (this.isStatic) return null
    const fn = this.host.ctor
    const partialClass = InfoReflect.getPartialClass(fn, this.name)
    return Info.from(partialClass)
  }

  get isConceptual() {
    if (this.isStatic) return false
    return this.concepts().next().done == false
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
      for (const concept of InfoReflect.getConceptHosts(fn, member.name)) {
        if (concept == host.ctor) continue
        seen.add(concept)
      }
    }

    // Map to Info instances
    yield *[...seen].map(fn => Info.from(fn))
  }

  *modifiers() { 
    yield* Es6Descriptor.modifiers(
      this.#descriptorInfo.descriptor, 
      InfoReflect.getMetadata(this.type))     
  }
  *pivots() { 
    if (this.isStatic) yield 'static' 
    if (this.isNonPublic) yield 'non-public'
    if (this.isKnown) yield 'known'
    yield* this.#descriptorInfo.pivots()
  }

  toString() {
    const keyInfo = this.keyInfo

    return [
      // e.g. 'myMethod', '[Symbol.mySymbol]'
      keyInfo.toString(), 
      
      [
        // e.g. 'static', 'non-public', 'known', 'conceptual', 'abstract'
        ...this.pivots(), 

        // e.g. 'sealed', 'enumerable', 'const', 'hidden'
        ...this.modifiers(),

        // e.g. 'getter', 'setter', 'property', 'method', 'field'
        this.type,

        // 'string', 'number', 'function', 'array' etc.
        this.fieldType ? `[${this.fieldType}]` : null,   

      ].filter(Boolean).join(' '),

      // e.g. '[classInfo MyClass]'
      this.host.toString()
    ].join(', ')
  }
}
