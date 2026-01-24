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

export class Es6ClassInfo {

  static from(fn) {
    if (!fn) return null
    assert(fn instanceof Function, 'fn must be a function')

    let info = Es6ClassWeakMap.get(fn)
    if (info) return info

    const idInfo = Es6IdInfo.create(fn.name)
    Es6ClassWeakMap.set(fn, info = new Es6ClassInfo(fn, idInfo))
    return info
  }

  #_
  #fn
  #idInfo

  constructor(fn, idInfo) {
    this.#fn = fn
    this.#idInfo = idInfo
    this.#_ = this.toString()
  }

  get ctor() { return this.#fn }
  get id() { return this.#idInfo }
  get name() { return this.id.value }
  get isNonPublic() { return this.id.isNonPublic }
  get isAnonymous() { return this.id.isAnonymous }
  get isKnown() { return Es6Reflect.isKnown(this.ctor) }

  get base() { return Es6ClassInfo.from(es6BaseType(this.ctor)) }

  *ownMembers({ isStatic = false } = { }) {
    const type = this.ctor
    let key, descriptor
    for (const current of Es6Reflect.ownDescriptors(type, { isStatic })) {
      switch (typeof current) {
        case 'string': key = current; continue
        case 'symbol': key = current; continue
        case 'object': descriptor = current; break
        default: assert(false, `Unexpected type: ${typeof current}`)
      }
      yield Es6MemberInfo.create(type, key, descriptor, { isStatic })
    }
  }
  getOwnMember(key, { isStatic = false } = { }) {
    const type = this.ctor
    const descriptor = Es6Reflect.getOwnDescriptor(
      type, key, { isStatic })
    if (!descriptor) return null
    return Es6MemberInfo.create(
      type, key, descriptor, { isStatic })
  }

  *members({ isStatic = false } = { }) {
    const type = this.ctor
    let key, owner, descriptor
    for (const current of Es6Reflect.descriptors(
      type, { isStatic })) {
      switch (typeof current) {
        case 'function': owner = current; continue
        case 'string': key = current; continue
        case 'symbol': key = current; continue
        case 'object': descriptor = current; break
        default: assert(false, `Unexpected type: ${typeof current}`)
      }
      yield Es6MemberInfo.create(owner, key, descriptor, { isStatic })
    }
  }
  getMember(key, { isStatic = false } = { }) {
    const type = this.ctor

    let owner
    for (const current of Es6Reflect.getDescriptor(
      type, key, { isStatic })) {
      switch (typeof current) {
        case 'function': owner = current; continue
        case 'object': 
          return Es6MemberInfo.create(owner, key, current, { isStatic })
        default: assert(false, `Unexpected type: ${typeof current}`)
      }
    }
    
    return null
  }

  *ownStaticMembers() { yield* this.ownMembers({ isStatic: true }) }
  getOwnStaticMember(key) { return this.getOwnMember(key, { isStatic: true }) }
  *staticMembers() { yield* this.members({ isStatic: true }) }
  getStaticMember(key) { return this.getMember(key, { isStatic: true }) }

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
  static create(fn, key, descriptor, { isStatic }) {
    const hostInfo = Es6ClassInfo.from(fn)
    const descriptorInfo = Es6DescriptorInfo.create(descriptor)
    const keyInfo = Es6KeyInfo.create(key)
    const memberType = Es6Reflect.typeof(fn, key, descriptor, { isStatic })
    const ctor = TypeMap.get(memberType)
    return new ctor(hostInfo, keyInfo, descriptorInfo, { isStatic })
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

  get name() { return this.#keyInfo.value }
  get keyInfo() { return this.#keyInfo }
  get descriptorInfo() { return this.#descriptorInfo }

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
    const isStatic = this.isStatic
    return Es6Reflect.isKnownKey(this.host.ctor, this.name, { isStatic })
  }
  get isAbstract() { return this.#descriptorInfo.isAbstract }

  // member types
  get isSetter() { return this instanceof Es6SetterInfo }
  get isGetter() { return this instanceof Es6GetterInfo }
  get isProperty() { return this instanceof Es6PropertyInfo }
  get isConstructor() { return this instanceof Es6ConstructorInfo }
  get isMethod() { return this instanceof Es6MethodInfo }
  get isField() { return this instanceof Es6FieldInfo }

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

  // member type groups
  get isAccessor() { return this.isGetter || this.isSetter || this.isProperty }
  get isFunction() { return this.isMethod || this.isConstructor }

  parent() {
    const parent = this.host.base
    if (!parent) return null

    const isStatic = this.isStatic
    return parent.getOwnMember(this.name, { isStatic })
  }

  equals(other) {
    if (!(other instanceof Es6MemberInfo)) return false
    if (this.#isStatic !== other.#isStatic) return false
    if (!this.#host.equals(other.#host)) return false
    if (!this.#descriptorInfo.equals(other.#descriptorInfo)) return false
    if (!this.#keyInfo.equals(other.#keyInfo)) return false
    return true
  }

  *modifiers() { 
    yield* Es6Descriptor.modifiers(
      this.#descriptorInfo.descriptor, 
      TypeMap.get(this.type)) 
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