import { assert } from '@kingjs/assert'
import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { Extensions } from '@kingjs/extensions'
import { Concept } from "@kingjs/concept"
import { PartialClass } from '@kingjs/partial-class'
import { PartialType } from '@kingjs/partial-type'
import { 
  Es6IdInfo,
  Es6KeyInfo,
  Es6DescriptorInfo,
} from "@kingjs/es6-info"
import { isAbstract } from "@kingjs/abstract"
import { PartialReflect } from '@kingjs/partial-reflect'
import { getMetadata } from './metadata.js'

const FunctionInfoCache = new WeakMap()

export class TypeInfo {

  static from(fn) {
    if (!fn) return null
    assert(typeof fn == 'function', 
      'fn must be a function')

    if (!FunctionInfoCache.has(fn))
      FunctionInfoCache.set(fn, TypeInfo.#create(fn))
    return FunctionInfoCache.get(fn)
  }
  static #create(fn) {

    if (PartialReflect.isExtensionOf(fn, Extensions)) 
      return new ExtensionsInfo(fn)
    if (PartialReflect.isExtensionOf(fn, PartialClass)) 
      return new PartialClassInfo(fn)
    if (PartialReflect.isExtensionOf(fn, Concept)) 
      return new ConceptInfo(fn)
    // TODO: refactor to handle ImplicitConcept and the like.
    return new ClassInfo(fn)
  }

  #_
  #idInfo
  #fn

  constructor(type) {
    this.#fn = type
    this.#idInfo = Es6IdInfo.create(type.name)
    this.#_ = this.toString()
  }

  get isPartialClass() { return this instanceof PartialClassInfo }
  get isExtensions() { return this instanceof ExtensionsInfo }
  get isConcept() { return this instanceof ConceptInfo }

  get ctor() { return this.#fn }
  get isKnown() { return PartialReflect.isKnown(this.ctor) }
  get isAbstract() { return PartialReflect.isAbstract(this.ctor) }

  get id() { return this.#idInfo }
  get name() { return this.id.value }
  get isNonPublic() { return this.id.isNonPublic }
  get isAnonymous() { return this.id.isAnonymous }
  get isTransparent() { return this.isExtensions }

  get base() { 
    return TypeInfo.from(PartialReflect.getExtendedType(this.ctor)) 
  }

  isExtensionOf(other) {
    assert(other instanceof TypeInfo, 'other must be a TypeInfo')
    return PartialReflect.isExtensionOf(this.ctor, other.ctor)
  }

  getOwnMember(key, { isStatic } = { }) {
    const host = this
    const fn = this.ctor
    const descriptor = PartialReflect.getOwnDescriptor(fn, key, { isStatic })
    if (!descriptor) return null
    return MemberInfo.create$(host, fn, key, descriptor, { isStatic })
  }
  getMember(key, { isStatic } = { }) {
    const host = this
    const fn = this.ctor
    let owner, descriptor

    found:
    for (const current of PartialReflect.getDescriptor(fn, key, { isStatic })) {
      switch (typeof current) {
        case 'function': owner = current; break
        case 'object': descriptor = current; break found
        default: assert(false, `Unexpected type: ${typeof current}`)
      }
    }
    if (!descriptor) return null
    return MemberInfo.create$(host, owner, key, descriptor, { isStatic })
  }
  *ownMembers({ isStatic } = { }) {
    if (this.isConcept && isStatic) return

    const host = this
    const fn = this.ctor
    let key
    for (const current of PartialReflect.ownDescriptors(fn, { isStatic })) {
      switch (typeof current) {
        case 'string':
        case 'symbol': key = current; break
        case 'object':
          yield MemberInfo.create$(host, fn, key, current, { isStatic })
          break
        default: assert(false, `Unexpected type: ${typeof current}`)
      }
    }
  }
  *members({ isStatic } = { }) {
    if (this.isConcept && isStatic) return

    const host = this
    const fn = this.ctor
    let owner, key
    for (const current of PartialReflect.descriptors(fn, { isStatic })) {
      switch (typeof current) {
        case 'function': owner = current; break
        case 'string':
        case 'symbol': key = current; break
        case 'object': {
          yield MemberInfo.create$(host, owner, key, current, { isStatic })
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
  *partialClasses() {
    yield* PartialReflect.baseTypes(this.ctor, { filter: PartialClass })
      .map(type => TypeInfo.from(type))
  }

  // concepts
  *concepts() {
    yield* PartialReflect.baseTypes(this.ctor, { filter: Concept })
      .map(type => TypeInfo.from(type))
  }
  *ownAssociatedConcepts() {
    yield *PartialReflect.metadataValues(this.ctor, { extensionOf: Concept })
      .map(({ key, value }) => ({
        key, 
        value: TypeInfo.from(value)
    }))
  }
  *associatedConcepts() {
    yield *PartialReflect.metadataValues(this.ctor, { extensionOf: Concept })
      .map(({ host, key, value }) => ({
        key, 
        value: TypeInfo.from(value),
        host: TypeInfo.from(host),
    }))
  }

  equals(other) { return this == other }

  //[util.inspect.custom]() { return this.toString() }
}
export class ClassInfo extends TypeInfo { 
  toString() { return `[classInfo ${this.id.toString()}]` }
}
export class ExtensionsInfo extends TypeInfo {
  toString() { return `[partialPojoInfo]` }
}
export class PartialClassInfo extends TypeInfo {
  toString() { return `[partialClassInfo ${this.id.toString()}]` }
}
export class ConceptInfo extends TypeInfo {
  toString() { return `[conceptInfo ${this.id.toString()}]` }
}

TypeInfo.Object = TypeInfo.from(Object)
TypeInfo.Function = TypeInfo.from(Function)
TypeInfo.Array = TypeInfo.from(Array)
TypeInfo.String = TypeInfo.from(String)
TypeInfo.Number = TypeInfo.from(Number)
TypeInfo.Boolean = TypeInfo.from(Boolean)
TypeInfo.PartialType = TypeInfo.from(PartialType)
TypeInfo.Extensions = TypeInfo.from(Extensions)
TypeInfo.PartialClass = TypeInfo.from(PartialClass)
TypeInfo.Concept = TypeInfo.from(Concept)

export class MemberInfo {
  static create$(host, fn, key, descriptor, { isStatic } = { }) {
    const keyInfo = Es6KeyInfo.create(key)
    const descriptorInfo = Es6DescriptorInfo.create(descriptor)
    const type = PartialReflect.typeof(fn, key, descriptor, { isStatic })
    
    const fnAsHost = TypeInfo.from(fn)
    const abstract = isAbstract(descriptor)
    if (!abstract || !fnAsHost.isAbstract)
      host = fnAsHost

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
  get isNonPublic() { return this.#keyInfo.isNonPublic }
  get isAbstract() { return isAbstract(this.descriptor) }

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
  get descriptor() { return this.#descriptorInfo.descriptor }

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

  get isConceptual() {
    if (this.isStatic) return false
    return this.concepts().next().done == false
  }

  // TODO: Should prob be ownConcepts since it does not include concepts
  // where the this.name is inherited.
  *concepts() {
    if (this.isStatic) return

    const { name, host: { ctor: type } } = this
    const filter = { filter: Concept }
    for (const current of PartialReflect.baseTypes(type, filter)) {
      if (!PartialReflect.hasOwnKey(current, name)) continue
      yield TypeInfo.from(current)
    }
  }

  *modifiers() { 
    yield* Es6Descriptor.modifiers(
      this.descriptor, 
      getMetadata(this.type))     
  }
  *pivots() { 
    if (this.isStatic) yield 'static' 
    if (this.isNonPublic) yield 'non-public'
    if (this.isAbstract) yield 'abstract'
  }

  toString() {
    const keyInfo = this.keyInfo

    return [
      // e.g. 'myMethod', '[Symbol.mySymbol]'
      keyInfo.toString(), 
      
      [
        // e.g. 'static', 'non-public', 'conceptual', 'abstract'
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
