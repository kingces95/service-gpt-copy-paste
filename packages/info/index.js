import assert from 'assert'
import { Descriptor } from "@kingjs/descriptor"
import { abstract } from "@kingjs/abstract"
async function __import() {
  const { infoToPojo } = await import('@kingjs/info-to-pojo')
  return { toPojo: infoToPojo }
}

const {  
  get: getDescriptor,
  hasValue,
  hasAccessor,
  hasGetter,
  hasSetter,
  hasClassPrototypeDefaults,
} = Descriptor

// Notes to AI:
// - JS convention for predicates is no "has" or "is" prefix, but
// for reflection packages (which typically expose abstractions with
// "info" suffix) we will use "is" prefix.

export class Info {
  static from(fn) {
    return new FunctionInfo(fn)
  }

  // get name() { abstract() }
  get isNonPublic() { 
    if (typeof this.name === 'symbol') return false

    const name = this.name
    if (name.startsWith('_')) return true
    if (name.endsWith('_')) return true
    if (name.startsWith('$')) return true
    if (name.endsWith('$')) return true
    return false
  }
}

export class FunctionInfo extends Info {
  async __toPojo() {
    const { toPojo } = await __import()
    const pojo = await toPojo(this)
    return pojo
  }
  *__allMembers() {
    yield* FunctionInfo.members(this)
    yield* FunctionInfo.members(this, { isStatic: true })
  }

  static Object = new FunctionInfo(Object)
  static Function = new FunctionInfo(Function)
  static Array = new FunctionInfo(Array)
  static String = new FunctionInfo(String)
  static Number = new FunctionInfo(Number)
  static Boolean = new FunctionInfo(Boolean)

  static getMember(type, nameOrSymbol, { isStatic = false } = { }) {
    assert(type instanceof FunctionInfo, 'type must be a FunctionInfo')

    // base case
    const member = type.getOwnMember(nameOrSymbol, { isStatic })
    if (member) return member

    // recursive case
    if (!type.base) return undefined
    return FunctionInfo.getMember(type.base, nameOrSymbol, { isStatic })
  }

  static *members(type, { isStatic = false } = { }) {
    assert(type instanceof FunctionInfo, 'type must be a FunctionInfo')

    yield* [...FunctionInfo.keys(type, { isStatic })].map(key => 
      FunctionInfo.getMember(type, key, { isStatic }))
  } 

  static *hierarchy(type) {
    assert(type instanceof FunctionInfo, 'type must be a FunctionInfo')
    
    for (let current = type; current; current = current.base) {
      yield current
    }
  }

  static *names(type, { isStatic = false } = { }) {
    yield* FunctionInfo.namesOrSymbols(type, { isStatic, fnName: 'ownNames' })
  }

  static *symbols(type, { isStatic = false } = { }) {
    yield* FunctionInfo.namesOrSymbols(type, { isStatic, fnName: 'ownSymbols' })
  }

  static *keys(type, { isStatic = false } = { }) {
    yield* FunctionInfo.names(type, { isStatic })
    yield* FunctionInfo.symbols(type, { isStatic })
  }

  static *namesOrSymbols(type, { isStatic, fnName } ) {
    assert(type instanceof FunctionInfo, 'type must be a FunctionInfo')
    
    const visted = new Set()
    for (const base of FunctionInfo.hierarchy(type)) {
      for (const key of base[fnName]({ isStatic })) {
        if (visted.has(key)) continue
        visted.add(key)
        yield key
      }
    }
  }

  #fn

  constructor(fn) {
    super()
    this.#fn = fn
  }

  #getPrototype({ isStatic = false } = { }) {
    return isStatic ? this.#fn : this.#fn.prototype
  }

  get ctor() { return this.#fn }
  get name() { return this.#fn.name ? this.#fn.name : null }
  get prototype() { return this.#fn.prototype }
  get basePrototype() { return Object.getPrototypeOf(this.prototype) }
  get base() { 
    const basePrototype = this.basePrototype
    if (!basePrototype) return
    return new FunctionInfo(basePrototype.constructor) 
  }

  *ownNames({ isStatic = false } = { }) {
    const prototype = this.#getPrototype({ isStatic })
    for(const name of Object.getOwnPropertyNames(prototype)) {
      if (name === '__proto__') continue
      yield name
    }
  }

  *ownSymbols({ isStatic = false } = { }) {
    const prototype = this.#getPrototype({ isStatic })
    yield* Object.getOwnPropertySymbols(prototype)
  }

  getOwnDescriptor(nameOrSymbol, { isStatic = false } = { }) {
    const prototype = this.#getPrototype({ isStatic })
    const descriptor = Object.getOwnPropertyDescriptor(prototype, nameOrSymbol)
    if (!descriptor) return undefined
    return DescriptorInfo.create(descriptor)
  }

  getOwnMember(nameOrSymbol, { isStatic = false } = { }) {
    const descriptorInfo = this.getOwnDescriptor(nameOrSymbol, { isStatic })
    if (!descriptorInfo) return undefined
    return MemberInfo.create$(
      this, nameOrSymbol, descriptorInfo, { isStatic })
  }

  equals(other) {
    if (!(other instanceof FunctionInfo)) return false
    return this.#fn === other.#fn
  }

  toString() { return this.name }
}

export class MemberInfo extends Info {
  static create$(host, nameOrSymbol, descriptor, metadata) {
    assert(host instanceof FunctionInfo, 
      'type must be a FunctionInfo')
    assert(descriptor instanceof DescriptorInfo, 
      'descriptor must be a DescriptorInfo')

    const ctor = 
      descriptor.constructor === MethodDescriptorInfo ? MethodMemberInfo 
      : descriptor.constructor === DataDescriptorInfo ? DataMemberInfo 
      : AccessorMemberInfo
    return new ctor(host, nameOrSymbol, descriptor, metadata)
  }

  #host
  #name
  #descriptor
  #metadata

  constructor(host, name, descriptor, metadata = { isStatic: false }) {
    super()
    this.#host = host
    this.#name = name
    this.#descriptor = descriptor
    this.#metadata = metadata
  }

  baseOrSelf$() { 
    const parent = this.parent()
    if (!parent) return this
    return parent.baseOrSelf$() 
  }

  get host() { return this.#host }
  get name() { return this.#name }
  get isKnown() {
    if (this.host.equals(FunctionInfo.Object)) return true
    if (this.isConstructor) return true

    if (this.isStatic) {
      if (this.isData) {
        if (this.name == 'length') return true
        if (this.name == 'name') return true
        if (this.name == 'prototype') return true
      }
    }
  }
  get descriptorInfo() { return this.#descriptor }

  get isAccessor() { return this instanceof AccessorMemberInfo }
  get isMethod() { return this instanceof MethodMemberInfo }
  get isData() { return this instanceof DataMemberInfo }
  get isConstructor() {
    if (this.name !== 'constructor') return false
    if (this.isStatic) return false
    if (!this.isData) return false
    return true
  }
  get type() {
    if (this.isAccessor) return 'accessor'
    if (this.isData) return 'data'
    if (this.isMethod) return 'method'
  }

  get isStatic() { return this.#metadata.isStatic }

  get isEnumerable() { return this.#descriptor.isEnumerable }
  get isConfigurable() { return this.#descriptor.isConfigurable }
  get isWritable() { return this.#descriptor.isWritable }

  get hasGetter() { return this.#descriptor.hasGetter }
  get hasSetter() { return this.#descriptor.hasSetter }
  get hasValue() { return this.#descriptor.hasValue }

  get getter() { return this.#descriptor.getter }
  get setter() { return this.#descriptor.setter }
  get value() { return this.#descriptor.value }

  get isAbstract() { 
    if (this.isMethod && this.value === abstract) 
      return true
    if (this.isAccessor && 
      (this.getter === abstract || this.setter === abstract))
      return true
    return false
  }

  parent() {
    // get member from the parent type
    const parent = this.host.base
    if (!parent) return null
    const isStatic = this.isStatic
    return parent.getOwnMember(this.name, { isStatic })
  }
  root() {
    let parent = this.parent()
    if (!parent) return null
    return parent.baseOrSelf$()
  }
  rootHost() {
    return this.root()?.host ?? null
  }

  equals(other) {
    if (!(other instanceof MemberInfo)) return false
    return this.#host.equals(other.#host) && 
      this.#name === other.#name
  }

  toString() { return `${this.#host.name}.${this.#name}` }
}

export class ValueMemberInfo extends MemberInfo { }
export class MethodMemberInfo extends ValueMemberInfo { }
export class DataMemberInfo extends ValueMemberInfo { }
export class AccessorMemberInfo extends MemberInfo { }

export class SatisfactionMemberInfo extends Info {
  #member
  #concept

  constructor(member, concept) {
    super()
    this.#member = member
    this.#concept = concept
  }

  get member() { return this.#member }
  get concept() { return this.#concept }  
}

export class DescriptorInfo {
  static create(descriptor) {
    if (hasValue(descriptor)) {
      const value = descriptor.value
      if (typeof value !== 'function') 
        return new DataDescriptorInfo(descriptor)

      // data member returning a function declared as a class
      if (hasClassPrototypeDefaults(getDescriptor(value, 'prototype')))
        return new DataDescriptorInfo(descriptor) 

      // data member returning a value declared as a method
      return new MethodDescriptorInfo(descriptor)
    }
    assert(hasAccessor(descriptor))
    return new AccessorDescriptorInfo(descriptor)
  }

  #descriptor

  constructor(descriptor) {
    this.#descriptor = descriptor
  }

  // type of descriptor
  get isAccessor() { return this instanceof AccessorDescriptorInfo }
  get isMethod() { return this instanceof MethodDescriptorInfo }
  get isData() { return this instanceof DataDescriptorInfo }
  
  get hasGetter() { return false }
  get hasSetter() { return false }
  get hasValue() { return this instanceof ValueDescriptorInfo }

  get getter() { return undefined }
  get setter() { return undefined }
  get value() { return undefined }
  
  get descriptor() { return this.#descriptor }
  get isEnumerable() { return this.descriptor.enumerable }
  get isConfigurable() { return this.descriptor.configurable }
}

export class ValueDescriptorInfo extends DescriptorInfo {
  constructor(descriptor) {
    super(descriptor)
  }

  get isWritable() { return this.descriptor.writable }
  get value() { return this.descriptor.value }
}

export class DataDescriptorInfo extends ValueDescriptorInfo {
  constructor(descriptor) {
    super(descriptor)
  }
}

export class MethodDescriptorInfo extends ValueDescriptorInfo {
  constructor(descriptor) {
    super(descriptor)
  }
}

export class AccessorDescriptorInfo extends DescriptorInfo {
  constructor(descriptor) {
    super(descriptor)
  }

  get hasGetter() { return hasGetter(this.descriptor) }
  get hasSetter() { return hasSetter(this.descriptor) }

  get getter() { return this.descriptor.get }
  get setter() { return this.descriptor.set }
}