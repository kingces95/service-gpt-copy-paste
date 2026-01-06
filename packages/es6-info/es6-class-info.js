import { assert } from '@kingjs/assert'
import { Reflection } from '@kingjs/reflection'
import { Descriptor } from "@kingjs/descriptor"
import { 
  Es6DescriptorInfo, 
  Es6AccessorDescriptorInfo,
  Es6ValueDescriptorInfo,
} from './es6-descriptor-info.js'
import { Es6IdInfo } from './es6-id-info.js'
import { Es6KeyInfo } from './es6-key-info.js'
import { es6Typeof } from "./es6-typeof.js"
import util from 'util'

const { 
  get: getDescriptor,
  hasClassPrototypeDefaults, 
} = Descriptor

export const Es6ObjectRuntimeNameOrSymbol = new Set([
  '__proto__',
])

export class Es6ClassInfo {

  static from(fn) {
    if (!fn) return null
    assert(fn instanceof Function, 'fn must be a function')
    return new Es6ClassInfo(fn)
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

  static #getMember(type, key, { isStatic = false } = { }) {
    for (const current of Es6ClassInfo.#hierarchy(type, { isStatic })) {
      const member = current.#getOwnMember(key, { isStatic })
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

    return Es6ClassInfo.from(baseFn) 
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

  *instanceMembers() { 
    yield* Es6ClassInfo.#members(this, { isStatic: false }) }
  *staticMembers() { 
    yield* Es6ClassInfo.#members(this, { isStatic: true }) }
  *members() {
    yield* Es6ClassInfo.#members(this, { isStatic: true })
    yield* Es6ClassInfo.#members(this, { isStatic: false })
  }

  getOwnInstanceMember(key) { return this.#getOwnMember(key, { isStatic: false }) }
  getOwnStaticMember(key) { return this.#getOwnMember(key, { isStatic: true }) }

  getStaticMember(key) { 
    return Es6ClassInfo.#getMember(this, key, { isStatic: true }) }
  getInstanceMember(key) { 
    return Es6ClassInfo.#getMember(this, key, { isStatic: false }) }

  equals(other) {
    if (!(other instanceof Es6ClassInfo)) return false
    return this.#fn === other.#fn
  }

  [util.inspect.custom]() { return this.toString() }
  toString() { return `[es6ClassInfo ${this.id.toString()}]` }
}

Es6ClassInfo.Object = new Es6ClassInfo(Object)
Es6ClassInfo.Function = new Es6ClassInfo(Function)
Es6ClassInfo.Array = new Es6ClassInfo(Array)
Es6ClassInfo.String = new Es6ClassInfo(String)
Es6ClassInfo.Number = new Es6ClassInfo(Number)
Es6ClassInfo.Boolean = new Es6ClassInfo(Boolean)

export class Es6MemberInfo {
  static create$(host, keyInfo, descriptorInfo, metadata) {
    assert(host instanceof Es6ClassInfo, 
      'type must be a Es6ClassInfo')

    assert(keyInfo instanceof Es6KeyInfo, 
      'key must be a KeyInfo')

    assert(descriptorInfo instanceof Es6DescriptorInfo, 
      'descriptor must be a DescriptorInfo')

    const args = [ host, keyInfo, descriptorInfo, metadata ]
      
    const { isAccessor, hasGetter, hasSetter } = descriptorInfo
    if (isAccessor) {
      if (!hasSetter) return new Es6GetterInfo(...args)
      if (!hasGetter) return new Es6SetterInfo(...args)
      return new Es6PropertyInfo(...args)
    }

    const value = descriptorInfo.value
    const { isStatic } = metadata
    const { value: key } = keyInfo

    // not a function is a field
    if (typeof value !== 'function')
      return new Es6FieldInfo(...args)

    // instance function 'constructor' matching host ctor is constructor
    if (key === 'constructor' && !isStatic && value === host.ctor)
      return new Es6ConstructorInfo(...args)

    // function but looks like a class ctor so not a method
    if (hasClassPrototypeDefaults(getDescriptor(value, 'prototype')))
      return new Es6FieldInfo(...args)

    // vanilla function but is enumerable so not a method 
    if (descriptorInfo.isEnumerable)
      return new Es6FieldInfo(...args)

    // vanilla hidden function is a method
    return new Es6MethodInfo(...args)
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
  get returnType() {
    if (this.isField) return es6Typeof(this.value)
    return 'object'
  }

  // pivots
  get isStatic() { return this.#isStatic }
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
  get isAbstract() { return this.#descriptorInfo.isAbstract }

  // member types
  get type() { return this.constructor.Type }
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
    if (this.isAbstract) yield 'abstract'
  }
  *modifiers() { 
    const ctor = this.constructor

    assert(ctor.DefaultConfigurable == true)
    if (this.#isConfigurable != ctor.DefaultConfigurable && this.isSealed)
      yield 'sealed'
    
    if ('DefaultWritable' in ctor) {
      assert(ctor.DefaultWritable == true)
      if (this.#isWritable != ctor.DefaultWritable && this.isConst)
        yield 'const'
    }

    if (this.#isEnumerable != ctor.DefaultEnumerable && this.isVisible)
      yield 'enumerable'

    if (this.#isEnumerable != ctor.DefaultEnumerable && !this.isVisible)
      yield 'hidden'
  }

  toStringType() {
    if (this.isField) return this.returnType
    return this.type
  }
  toString() {
    const keyInfo = this.keyInfo

    return [
      // e.g. 'myMethod', '[Symbol.mySymbol]'
      keyInfo.toString(), 
      
      [
        // e.g. 'static', 'non-public', 'known'
        ...this.pivots(), 

        // e.g. 'sealed', 'enumerable', 'const', 'hidden'
        ...this.modifiers(),

        // e.g. 'method', 'constructor, 'getter', 'setter', 'property'
        // or when field 'string', 'number', 'function', 'array' etc.
        this.toStringType(), 

      ].filter(Boolean).join(' '),

      // e.g. '[es6ClassInfo MyClass]'
      this.host.toString()
    ].join(', ')
  }
}

export class Es6GetterInfo extends Es6MemberInfo {
  static Type = 'getter'
  static DefaultConfigurable = Es6DescriptorInfo.DefaultConfigurable
  static DefaultEnumerable = Es6AccessorDescriptorInfo.DefaultEnumerable
}
export class Es6SetterInfo extends Es6MemberInfo { 
  static Type = 'setter'
  static DefaultConfigurable = Es6DescriptorInfo.DefaultConfigurable
  static DefaultEnumerable = Es6AccessorDescriptorInfo.DefaultEnumerable
}
export class Es6PropertyInfo extends Es6MemberInfo { 
  static Type = 'property'
  static DefaultConfigurable = Es6DescriptorInfo.DefaultConfigurable
  static DefaultEnumerable = Es6AccessorDescriptorInfo.DefaultEnumerable
}
export class Es6FieldInfo extends Es6MemberInfo { 
  static Type = 'field'
  static DefaultConfigurable = Es6DescriptorInfo.DefaultConfigurable
  static DefaultWritable = Es6ValueDescriptorInfo.DefaultWritable
  static DefaultEnumerable = true
}
export class Es6MethodInfo extends Es6MemberInfo { 
  static Type = 'method'
  static DefaultConfigurable = Es6DescriptorInfo.DefaultConfigurable
  static DefaultWritable = Es6ValueDescriptorInfo.DefaultWritable
  static DefaultEnumerable = false
}
export class Es6ConstructorInfo extends Es6MemberInfo { 
  static Type = 'constructor'
  static DefaultConfigurable = Es6DescriptorInfo.DefaultConfigurable
  static DefaultWritable = Es6ValueDescriptorInfo.DefaultWritable
  static DefaultEnumerable = false
}
  
