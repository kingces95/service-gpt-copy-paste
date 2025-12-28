import { assert } from '@kingjs/assert'
import { Es6DescriptorInfo } from './es6-descriptor-info.js'
import { Es6IdInfo } from './es6-id-info.js'
import { Es6KeyInfo } from './es6-key-info.js'
import { Reflection } from '@kingjs/reflection'
import util from 'util'

// Es6MemberInfo = Es6DescriptorInfo + name + host + isStatic

export const Es6ObjectRuntimeNameOrSymbol = new Set([
  '__proto__',
])

export class Es6Info {
  static from(fn) {
    if (!fn) return null
    assert(fn instanceof Function, 'fn must be a function')
    return new Es6ClassInfo(fn)
  }
}

export class Es6ClassInfo extends Es6Info {

  static getMember(type, key, { isStatic = false } = { }) {
    assert(type instanceof Es6ClassInfo, 'type must be a Es6ClassInfo')

    for (const current of Es6ClassInfo.#hierarchy(type, { isStatic })) {
      const member = current.#getOwnMember(key, { isStatic })
      if (member) return member
    }

    return null
  }
  static getStaticMember(type, key) {
    return Es6ClassInfo.getMember(type, key, { isStatic: true }) }
  static getInstanceMember(type, key) {
    return Es6ClassInfo.getMember(type, key, { isStatic: false }) }

  static *instanceMembers(type) { 
    yield* Es6ClassInfo.#members(type, { isStatic: false }) }
  static *staticMembers(type) { 
    yield* Es6ClassInfo.#members(type, { isStatic: true }) }
  static *members(type) {
    yield* Es6ClassInfo.#members(type, { isStatic: true })
    yield* Es6ClassInfo.#members(type, { isStatic: false })
  }

  static *#members(type, { isStatic = false } = { }) {
    assert(type instanceof Es6ClassInfo, 'type must be a Es6ClassInfo')

    const visited = new Set()
    for (const current of Es6ClassInfo.#hierarchy(type, { isStatic })) {
      for (const member of current.#ownMembers({ isStatic })) {
        if (visited.has(member.name)) continue
        visited.add(member.name)
        yield member
      }
    }
  } 

  static *#hierarchy(type, { isStatic = false } = { }) {
    assert(type instanceof Es6ClassInfo, 'type must be a Es6ClassInfo')

    for (let current = type; current; current = current.base) {
      
      // Typically given a function F, 
      //    Object.getPrototypeOf(F) 
      // is the function that F extends. But for Function, 
      //    Object.getPrototypeOf(Function)
      // is not Object but the known object Function.prototype. For this
      // reason, Function does not inherit Object static members and
      // so Object should not be included in the *static* hierarchy of 
      // Function.
      if (isStatic && current.isObject$ && !type.isObject$) 
        break

      yield current
    }
  }

  #_
  #fn
  #idInfo

  constructor(fn) {
    super()
    this.#fn = fn
    this.#idInfo = Es6IdInfo.create(fn.name)
    this.#_ = this.toString()
  }

  *#ownMembers({ isStatic = false } = { }) {
    const definitions = this.getDefinitions$({ isStatic })
    
    for (const key of Reflect.ownKeys(definitions)) {
      if (Es6ObjectRuntimeNameOrSymbol.has(key)) continue
      
      const descriptor = Object.getOwnPropertyDescriptor(definitions, key)
      const descriptorInfo = Es6DescriptorInfo.create(descriptor)
      const keyInfo = Es6KeyInfo.create(key)
      yield Es6MemberInfo.create$(this, keyInfo, descriptorInfo, { isStatic })
    }
  }
  #getOwnMember(key, { isStatic = false } = { }) {
    if (key == null) return null
    if (Es6ObjectRuntimeNameOrSymbol.has(key)) return null

    const definitions = this.getDefinitions$({ isStatic })
    const descriptor = Object.getOwnPropertyDescriptor(definitions, key)
    if (!descriptor) return null
    
    const descriptorInfo = Es6DescriptorInfo.create(descriptor)
    const keyInfo = Es6KeyInfo.create(key)
    return Es6MemberInfo.create$(this, keyInfo, descriptorInfo, { isStatic })
  }

  get isObject$() { return this.#fn === Object }

  getDefinitions$({ isStatic = false } = { }) {
    return isStatic ? this.#fn : this.#fn.prototype
  }

  get ctor() { return this.#fn }
  get id() { return this.#idInfo }
  get name() { return this.id.value }
  get isAnonymous() { return this.id.isAnonymous }
  get base() { 
    if (this.equals(Es6ClassInfo.Object)) return null

    const baseFn = Object.getPrototypeOf(this.ctor)
    
    // special case 'boostrap circle' for Function
    if (baseFn == Function.prototype) return Es6ClassInfo.Object

    return Es6Info.from(baseFn) 
  }
  get isNonPublic() { 
    return this.#idInfo.isNonPublic
  }
  get isKnown() {
    if (this.equals(Es6ClassInfo.Object)) return true
    if (this.equals(Es6ClassInfo.Function)) return true
    return false
  }

  *ownInstanceMembers() { yield* this.#ownMembers({ isStatic: false }) }
  *ownStaticMembers() { yield* this.#ownMembers({ isStatic: true }) }
  *ownMembers() {
    yield* this.#ownMembers({ isStatic: false })
    yield* this.#ownMembers({ isStatic: true })
  }

  getOwnInstanceMember(name) {
    return this.#getOwnMember(name, { isStatic: false }) }
  getOwnStaticMember(name) {
    return this.#getOwnMember(name, { isStatic: true }) }

  // Convienience aliases for Es6ClassInfo.* methods. The static methods
  // host the logic instead of the instance methods because the methods
  // return members from the entire hierarchy, which is more correctly
  // expressed as static traversal methods. That said, these convienience 
  // instance methods are useful and expected.
  *members() { yield* Es6ClassInfo.members(this) }
  *staticMembers() { yield* Es6ClassInfo.staticMembers(this) }
  *instanceMembers() { yield* Es6ClassInfo.instanceMembers(this) }
  getStaticMember(key) { return Es6ClassInfo.getStaticMember(this, key) }
  getInstanceMember(key) { return Es6ClassInfo.getInstanceMember(this, key) }

  equals(other) {
    if (!(other instanceof Es6ClassInfo)) return false
    return this.#fn === other.#fn
  }

  [util.inspect.custom]() { return this.toString() }
  toString() { return `[es6ClassInfo ${this.id.toString()}]` }
}

Es6Info.Object = new Es6ClassInfo(Object)
Es6Info.Function = new Es6ClassInfo(Function)
Es6Info.Array = new Es6ClassInfo(Array)
Es6Info.String = new Es6ClassInfo(String)
Es6Info.Number = new Es6ClassInfo(Number)
Es6Info.Boolean = new Es6ClassInfo(Boolean)

export class Es6MemberInfo extends Es6Info {
  static create$(host, keyInfo, descriptorInfo, metadata) {
    assert(host instanceof Es6ClassInfo, 
      'type must be a Es6ClassInfo')

    assert(keyInfo instanceof Es6KeyInfo, 
      'key must be a KeyInfo')

    assert(descriptorInfo instanceof Es6DescriptorInfo, 
      'descriptor must be a DescriptorInfo')

    assert(descriptorInfo.isData 
      || descriptorInfo.isMethod 
      || descriptorInfo.isAccessor,
      'descriptor must be a data, method, or accessor descriptor')
    
    const ctor = this.#discriminate(host, keyInfo, descriptorInfo, metadata)
    return new ctor(host, keyInfo, descriptorInfo, metadata)
  }

  static #discriminate(host, keyInfo, descriptorInfo, { isStatic } = { }) {
    if (descriptorInfo.isAccessor) 
      return Es6AccessorMemberInfo

    if (host 
      && keyInfo.value === 'constructor'
      && !isStatic
      && descriptorInfo.value === host.ctor)
      return Es6ConstructorMemberInfo

    if (descriptorInfo.isMethod) 
      return Es6MethodMemberInfo

    assert(descriptorInfo.isData,
      'descriptor must be a data descriptor')
    return Es6DataMemberInfo
  }

  #_
  #host
  #keyInfo
  #descriptorInfo
  #isStatic

  constructor(host, keyInfo, descriptorInfo, metadata = { 
    isStatic: false,
  }) {
    super()
    this.#host = host
    this.#keyInfo = keyInfo
    this.#descriptorInfo = descriptorInfo

    const { isStatic } = metadata
    this.#isStatic = isStatic
    this.#_ = this.toString()
  }

  get keyInfo$() { return this.#keyInfo }
  rootOrSelf$() {
    const parent = this.parent() 
    return parent ? parent.rootOrSelf$() : this 
  }

  get descriptorInfo() { return this.#descriptorInfo }
  get host() { return this.#host }
  get name() { return this.#keyInfo.value }
  get isNonPublic() { return this.#keyInfo.isNonPublic }
  get isKnown() {
    if (this.host.isKnown) return true

    if (this.isStatic) {
      if (Reflection.isKnownStaticMember(this.name)) return true
    } else {
      if (Reflection.isKnownInstanceMember(this.name)) return true
    }

    return false
  }
  get type() {
    // useful for pivoting
    if (this.isAccessor) return 'accessor'
    if (this.isData) return 'data'
    if (this.isConstructor) return 'constructor'
    if (this.isMethod) return 'method'
    assert(false, 'unreachable')
  }

  get isAccessor() { return this instanceof Es6AccessorMemberInfo }
  get isMethod() { return this instanceof Es6MethodMemberInfo }
  get isData() { return this instanceof Es6DataMemberInfo }
  get isConstructor() { return this instanceof Es6ConstructorMemberInfo }

  get isStatic() { return this.#isStatic }

  get isEnumerable() { return this.#descriptorInfo.isEnumerable }
  get isConfigurable() { return this.#descriptorInfo.isConfigurable }
  get isWritable() { return this.#descriptorInfo.isWritable }

  get hasGetter() { return this.#descriptorInfo.hasGetter }
  get hasSetter() { return this.#descriptorInfo.hasSetter }
  get hasValue() { return this.#descriptorInfo.hasValue }

  get getter() { return this.#descriptorInfo.getter }
  get setter() { return this.#descriptorInfo.setter }
  get value() { return this.#descriptorInfo.value }

  parent() {
    const parent = this.host.base
    if (!parent) return null

    return this.isStatic
      ? parent.getOwnStaticMember(this.name)
      : parent.getOwnInstanceMember(this.name)
  }
  root() {
    let parent = this.parent()
    if (!parent) return null
    return parent.rootOrSelf$()
  }
  rootHost() {
    return this.root()?.host ?? null
  }

  equals(other) {
    if (!(other instanceof Es6MemberInfo)) return false
    if (this.#isStatic !== other.#isStatic) return false
    if (!this.#host.equals(other.#host)) return false
    if (!this.#keyInfo.equals(other.#keyInfo)) return false
    if (!this.#descriptorInfo.equals(other.#descriptorInfo)) return false
    return true
  }

  toString({ modifiers = [], host = this.host } = { }) {
    const keyInfo = this.keyInfo$

    return [
      keyInfo.toString(), [
        this.isStatic ? 'static' : null,
        ...modifiers,
        this.#descriptorInfo.toString(),
      ].filter(Boolean).join(' '),
      host.toString()
    ].join(', ')
  }
}
export class Es6ValueMemberInfo extends Es6MemberInfo { 
}
export class Es6DataMemberInfo extends Es6ValueMemberInfo { 
}
export class Es6MethodMemberInfo extends Es6ValueMemberInfo { 
}
export class Es6ConstructorMemberInfo extends Es6MethodMemberInfo { 
}
export class Es6AccessorMemberInfo extends Es6MemberInfo { 
}

