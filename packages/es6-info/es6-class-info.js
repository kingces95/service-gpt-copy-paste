import { assert } from '@kingjs/assert'
import { es6BaseType } from '@kingjs/es6-base-type'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { 
  Es6DescriptorInfo, 
  Es6GetterDescriptorInfo,
  Es6SetterDescriptorInfo,
  Es6PropertyDescriptorInfo,
  Es6FieldDescriptorInfo,
  Es6MethodDescriptorInfo,
} from './es6-descriptor-info.js'
import { Es6IdInfo } from './es6-id-info.js'
import { Es6KeyInfo } from './es6-key-info.js'
import { es6Typeof } from '@kingjs/es6-typeof'
import util from 'util'

const Es6ClassWeakMap = new WeakMap()

export const Es6ObjectRuntimeNameOrSymbol = new Set([
  '__proto__',
])

export class Es6ClassInfo {

  static from(fn) {
    if (!fn) return null
    assert(fn instanceof Function, 'fn must be a function')

    let info = Es6ClassWeakMap.get(fn)
    if (info) return info
    Es6ClassWeakMap.set(fn, info = new Es6ClassInfo(fn))
    return info
  }

  static *#members(type, { isStatic = false } = { }) {
    assert(type instanceof Es6ClassInfo, 'type must be a Es6ClassInfo')

    const visited = new Set()
    for (const current of Es6ClassInfo.#hierarchy(type, { isStatic })) {
      for (const member of current.ownMembers$({ isStatic })) {
        if (visited.has(member.name)) continue
        visited.add(member.name)
        yield member
      }
    }
  } 

  static #getMember(type, key, { isStatic = false } = { }) {
    for (const current of Es6ClassInfo.#hierarchy(type, { isStatic })) {
      const member = current.getOwnMember$(key, { isStatic })
      if (member) return member
    }

    return null
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
    this.#fn = fn
    this.#idInfo = Es6IdInfo.create(fn.name)
    this.#_ = this.toString()
  }

  get isObject$() { return this.#fn === Object }

  *ownMembers$({ isStatic = false } = { }) {
    const definitions = this.getDefinitions$({ isStatic })
    
    for (const key of Reflect.ownKeys(definitions)) {
      if (Es6ObjectRuntimeNameOrSymbol.has(key)) continue
      
      const descriptor = Object.getOwnPropertyDescriptor(definitions, key)
      const descriptorInfo = Es6DescriptorInfo.create(descriptor)
      const keyInfo = Es6KeyInfo.create(key)
      yield Es6MemberInfo.create$(this, keyInfo, descriptorInfo, { isStatic })
    }
  }
  getOwnMember$(key, { isStatic = false } = { }) {
    if (key == null) return null
    if (Es6ObjectRuntimeNameOrSymbol.has(key)) return null

    const definitions = this.getDefinitions$({ isStatic })
    const descriptor = Object.getOwnPropertyDescriptor(definitions, key)
    if (!descriptor) return null
    
    const descriptorInfo = Es6DescriptorInfo.create(descriptor)
    const keyInfo = Es6KeyInfo.create(key)
    return Es6MemberInfo.create$(this, keyInfo, descriptorInfo, { isStatic })
  }
  getDefinitions$({ isStatic = false } = { }) {
    return isStatic ? this.#fn : this.#fn.prototype
  }

  get ctor() { return this.#fn }
  get id() { return this.#idInfo }
  get name() { return this.id.value }
  get isNonPublic() { return this.id.isNonPublic }
  get isAnonymous() { return this.id.isAnonymous }
  get isKnown() { return Es6Reflect.isKnown(this.ctor) }

  get base() { return Es6ClassInfo.from(es6BaseType(this.ctor)) }

  *ownInstanceMembers() { yield* this.ownMembers$({ isStatic: false }) }
  *ownStaticMembers() { yield* this.ownMembers$({ isStatic: true }) }
  *ownMembers() {
    yield* this.ownMembers$({ isStatic: false })
    yield* this.ownMembers$({ isStatic: true })
  }
  getOwnInstanceMember(key) { return this.getOwnMember$(key, { isStatic: false }) }
  getOwnStaticMember(key) { return this.getOwnMember$(key, { isStatic: true }) }

  *instanceMembers() { 
    yield* Es6ClassInfo.#members(this, { isStatic: false }) }
  *staticMembers() { 
    yield* Es6ClassInfo.#members(this, { isStatic: true }) }
  *members() {
    yield* Es6ClassInfo.#members(this, { isStatic: true })
    yield* Es6ClassInfo.#members(this, { isStatic: false }) }
  getStaticMember(key) { 
    return Es6ClassInfo.#getMember(this, key, { isStatic: true }) }
  getInstanceMember(key) { 
    return Es6ClassInfo.#getMember(this, key, { isStatic: false }) }

  equals(other) { return this == other }

  [util.inspect.custom]() { return this.toString() }
  toString() { return `[es6ClassInfo ${this.id.toString()}]` }
}

Es6ClassInfo.Object = Es6ClassInfo.from(Object)
Es6ClassInfo.Function = Es6ClassInfo.from(Function)
Es6ClassInfo.Array = Es6ClassInfo.from(Array)
Es6ClassInfo.String = Es6ClassInfo.from(String)
Es6ClassInfo.Number = Es6ClassInfo.from(Number)
Es6ClassInfo.Boolean = Es6ClassInfo.from(Boolean)

export class Es6MemberInfo {
  static create$(host, keyInfo, descriptorInfo, metadata) {
    assert(host instanceof Es6ClassInfo, 
      'type must be a Es6ClassInfo')
    assert(keyInfo instanceof Es6KeyInfo, 
      'key must be a KeyInfo')
    assert(descriptorInfo instanceof Es6DescriptorInfo, 
      'descriptor must be a DescriptorInfo')

    let type = descriptorInfo.type

    if (type == 'field') {
      const value = descriptorInfo.value
      const { isStatic } = metadata
      const { value: key } = keyInfo
      const es6Type = es6Typeof(value)

      // constructor
      if (key === 'constructor' && !isStatic && value === host.ctor) {
        assert(es6Type == 'class')
        type = 'constructor'
      }
    }

    const ctor = TypeMap.get(type)
    assert(ctor, `Unknown member type.`)
    return new ctor(host, keyInfo, descriptorInfo, metadata)
  }

  #_
  #host
  #keyInfo
  #descriptorInfo
  #isStatic

  constructor(host, keyInfo, descriptorInfo, metadata = { 
    isStatic: false,
  }) {
    this.#host = host
    this.#keyInfo = keyInfo
    this.#descriptorInfo = descriptorInfo

    const { isStatic } = metadata
    this.#isStatic = isStatic
    this.#_ = this.toString()
  }

  get #isEnumerable() { return this.#descriptorInfo.isEnumerable }
  get #isConfigurable() { return this.#descriptorInfo.isConfigurable }
  get #isWritable() { return this.#descriptorInfo.isWritable }

  rootOrSelf$() {
    const parent = this.parent() 
    return parent ? parent.rootOrSelf$() : this 
  }

  get name() { return this.#keyInfo.value }
  get keyInfo() { return this.#keyInfo }

  get host() { return this.#host }
  get type() { return this.constructor.Type }
  get fieldType() { 
    if (!this.isField) return null
    return this.#descriptorInfo.fieldType 
  }

  // pivots
  get isStatic() { return this.#isStatic }
  get isNonPublic() { return this.#keyInfo.isNonPublic }
  get isKnown() {
    if (this.host.isKnown) return true

    return Es6Reflect.isKnownKey$(this.host.ctor, this.name, this.isStatic)
  }
  get isAbstract() { return this.#descriptorInfo.isAbstract }

  // member types
  get isSetter() { return this instanceof Es6SetterInfo }
  get isGetter() { return this instanceof Es6GetterInfo }
  get isProperty() { return this instanceof Es6PropertyInfo }
  get isConstructor() { return this instanceof Es6ConstructorInfo }
  get isMethod() { return this instanceof Es6MethodInfo }
  get isField() { return this instanceof Es6FieldInfo }

  // member type groups
  get isAccessor() { return this.isGetter || this.isSetter || this.isProperty }
  get isFunction() { return this.isMethod || this.isConstructor }

  // member modifiers
  get isVisible() { return this.#isEnumerable }
  get isHidden() { return !this.isVisible }
  get isSealed() { return !this.#isConfigurable }
  get isConst() { return !this.isAccessor && !this.#isWritable }

  // descriptor values
  get getter() { if (this.isAccessor) return this.#descriptorInfo.getter }
  get setter() { if (this.isAccessor) return this.#descriptorInfo.setter }
  get value() { if (this.isField) return this.#descriptorInfo.value }
  get method() { if (this.isMethod) return this.#descriptorInfo.value }
  get ctor() { if (this.isConstructor) return this.#descriptorInfo.value }

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

  *pivots() { 
    if (this.isStatic) yield 'static' 
    if (this.isNonPublic) yield 'non-public'
    if (this.isKnown) yield 'known'
    yield* this.#descriptorInfo.pivots()
  }
  *modifiers() { 
    yield* Es6Descriptor.modifiers(
      this.#descriptorInfo.descriptor, 
      TypeMap.get(this.type)) 
  }

  toStringType() {
    if (this.isField) return this.fieldType
    return this.type
  }
  toString() {
    const keyInfo = this.keyInfo

    return [
      // e.g. 'myMethod', '[Symbol.mySymbol]'
      keyInfo.toString(), 
      
    [
      // e.g. 'abstract'
      ...this.pivots(), 

      // e.g. 'const', 'visible', 'hidden', 'sealed'
      ...this.modifiers(),

      // e.g. 'getter', 'setter', 'property', 'method', 'field'
      this.type,

      // 'string', 'number', 'function', 'array' etc.
      this.fieldType ? `[${this.fieldType}]` : null,   

    ].filter(Boolean).join(' '),

      // e.g. '[es6ClassInfo MyClass]'
      this.host.toString()
    ].join(', ')
  }
}

export class Es6GetterInfo extends Es6MemberInfo {
  static Type = 'getter'
  static DefaultConfigurable = Es6GetterDescriptorInfo.DefaultConfigurable
  static DefaultEnumerable = Es6GetterDescriptorInfo.DefaultEnumerable
}
export class Es6SetterInfo extends Es6MemberInfo { 
  static Type = 'setter'
  static DefaultConfigurable = Es6SetterDescriptorInfo.DefaultConfigurable
  static DefaultEnumerable = Es6SetterDescriptorInfo.DefaultEnumerable
}
export class Es6PropertyInfo extends Es6MemberInfo { 
  static Type = 'property'
  static DefaultConfigurable = Es6PropertyDescriptorInfo.DefaultConfigurable
  static DefaultEnumerable = Es6PropertyDescriptorInfo.DefaultEnumerable
}
export class Es6FieldInfo extends Es6MemberInfo { 
  static Type = 'field'
  static DefaultConfigurable = Es6FieldDescriptorInfo.DefaultConfigurable
  static DefaultWritable = Es6FieldDescriptorInfo.DefaultWritable
  static DefaultEnumerable = Es6FieldDescriptorInfo.DefaultEnumerable
}
export class Es6MethodInfo extends Es6MemberInfo { 
  static Type = 'method'
  static DefaultConfigurable = Es6MethodDescriptorInfo.DefaultConfigurable
  static DefaultWritable = Es6MethodDescriptorInfo.DefaultWritable
  static DefaultEnumerable = Es6MethodDescriptorInfo.DefaultEnumerable
}
export class Es6ConstructorInfo extends Es6MemberInfo { 
  static Type = 'constructor'
  static DefaultConfigurable = Es6MethodDescriptorInfo.DefaultConfigurable
  static DefaultWritable = Es6MethodDescriptorInfo.DefaultWritable
  static DefaultEnumerable = Es6MethodDescriptorInfo.DefaultEnumerable
}
export class Es6PrototypeInfo extends Es6MemberInfo { 
  static Type = 'prototype'
  static DefaultConfigurable = false
  static DefaultWritable = false
  static DefaultEnumerable = false
}
  
const TypeMap = new Map([
  [Es6FieldInfo.Type, Es6FieldInfo],
  [Es6MethodInfo.Type, Es6MethodInfo],
  [Es6GetterInfo.Type, Es6GetterInfo],
  [Es6SetterInfo.Type, Es6SetterInfo],
  [Es6PropertyInfo.Type, Es6PropertyInfo],
  [Es6ConstructorInfo.Type, Es6ConstructorInfo],
  [Es6PrototypeInfo.Type, Es6PrototypeInfo],
])