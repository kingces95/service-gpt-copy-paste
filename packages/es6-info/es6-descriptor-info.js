import { assert } from '@kingjs/assert'
import { Descriptor } from "@kingjs/descriptor"
import { es6Typeof } from "./es6-typeof.js"

const {  
  get: getDescriptor,
  hasValue,
  hasAccessor,
  hasGetter,
  hasSetter,
  hasClassPrototypeDefaults,
  DefaultModifier,
} = Descriptor

const {
  userDefined: DefaultUserDefinedModifier,
  accessor: DefaultAccessorModifier,
  value: DefaultValueModifier,
  method: DefaultMethodModifier,
  data: DefaultDataModifier,
} = DefaultModifier


// Describes an ES6 property descriptor. The descriptor can be one of three types:
// - Accessor descriptor: 
//      has get and/or set functions, but no value.
// - Data descriptor: 
//      has a value that is not a function, or is a function but looks like a class or 
//      is enumerable.
// - Method descriptor: 
//      has a value that is a non-enumerable function that does not look like a class.

// The descriptor info also provides information about the descriptor's attributes:
// - configurable
// - enumerable
// - writable (data and method descriptors only)

// The descriptor info provides a toString method that summarizes the descriptor in a
// concise format. The modifiers configurable, enumerable, and writable are only
// included in the string when they differ from their default values. The default
// values are:
// - configurable: true
// - writable: true (data and method descriptors only)
// - enumerable:
//      false (accessor descriptors)
//      true (data descriptors)
//      false (method descriptors)

// The modifier const is used to indicate that writable is false.
// The modifier sealed is used to indicate that configurable is false.
// The modifier hidden is used to indicate that enumerable is false for data descriptors.

// The id of the descriptor is included in the string when it can be inferred from
// the function name of the getter, setter, or value. If the id is anonymous (null 
// or undefined), then the string '<anonymous>' is used. Otherwise, the id is converted 
// to a string. If the id is a symbol, it is enclosed in brackets. 

// Typical Examples:
// - Accessor descriptor: 
//      "myId { get; set }"
// - Data descriptor: 
//      "value: [array]"
// - Method descriptor: 
//      "myMethod()"

// Annonymous Examples:
// - Accessor descriptor: 
//      "<anonymous> { get; set }"
// - Method descriptor: 
//      "<anonymous>()"

// Kitchen Sink Examples:
// - Accessor descriptor: 
//      "sealed const enumerable myId { get; set }"
// - Data descriptor: 
//      "const hidden value: [array]"
// - Method descriptor: 
//      "sealed const myMethod()"

export class Es6DescriptorInfo {
  static DefaultConfigurable = DefaultUserDefinedModifier.configurable

  static create(descriptor) {
    
    // accessor descriptor (no value)
    if (!hasValue(descriptor)) {
      assert(hasAccessor(descriptor))
      return new Es6AccessorDescriptorInfo(descriptor)
    }

    // value descriptor (has value)
    assert(hasValue(descriptor))

    // data descriptor (has value but not a function)
    const value = descriptor.value
    if (typeof value !== 'function') 
      return new Es6DataDescriptorInfo(descriptor)

    // data descriptor (has value, is a function, but looks like a class)
    if (hasClassPrototypeDefaults(getDescriptor(value, 'prototype')))
      return new Es6DataDescriptorInfo(descriptor) 

    // data descriptor (has value, is a function, but is enumerable)
    if (descriptor.enumerable)
      return new Es6DataDescriptorInfo(descriptor)

    // method descriptor (has value, is a function, not enumerable)
    return new Es6MethodDescriptorInfo(descriptor)
  }

  #descriptor

  constructor(descriptor) {
    this.#descriptor = descriptor
  }

  // type of descriptor
  // get type() { abstract }
  get isAccessor() { return this.type == Es6AccessorDescriptorInfo.Tag }
  get isData() { return this.type == Es6DataDescriptorInfo.Tag }
  get isMethod() { return this.type == Es6MethodDescriptorInfo.Tag }
  get hasValue() { return this instanceof Es6ValueDescriptorInfo }

  get hasGetter() { return hasGetter(this.descriptor) }
  get hasSetter() { return hasSetter(this.descriptor) }

  get getter() { return this.descriptor.get }
  get setter() { return this.descriptor.set }
  get value() { return this.descriptor.value }
  
  get descriptor() { return this.#descriptor }
  get isEnumerable() { return this.descriptor.enumerable }
  get isConfigurable() { return this.descriptor.configurable }
  get isWritable() { return !!this.descriptor.writable }

  equals(other) {
    if (!(other instanceof Es6DescriptorInfo)) return false
    const a = this.descriptor
    const b = other.descriptor

    if (a.configurable !== b.configurable) return false
    if (a.enumerable !== b.enumerable) return false

    if (this.hasValue != other.hasValue) return false
    if (this.hasValue) {
      if (a.writable !== b.writable) return false
      if (a.value !== b.value) {
        if (!(Number.isNaN(a.value) && Number.isNaN(b.value))) 
          return false
      }
    } else {
      if (a.get !== b.get) return false
      if (a.set !== b.set) return false
    }

    return true
  }

  *modifiers() {
    if (this.isConfigurable != Es6DescriptorInfo.DefaultConfigurable)
      yield 'sealed'
  }
}

export class Es6AccessorDescriptorInfo extends Es6DescriptorInfo {
  static Tag = 'accessor'
  static DefaultEnumerable = DefaultAccessorModifier.enumerable

  get type() { return Es6AccessorDescriptorInfo.Tag }

  *modifiers() { 
    yield* super.modifiers()
    if (this.isEnumerable != Es6AccessorDescriptorInfo.DefaultEnumerable)
      yield 'enumerable'
  }

  toString() {
    return [
      ...this.modifiers(),
      '{', [
        !this.hasGetter ? null : `get`,
        !this.hasSetter ? null : `set`,
      ].filter(Boolean).join('; '), '}'
    ].filter(Boolean).join(' ')
  }
}

export class Es6ValueDescriptorInfo extends Es6DescriptorInfo { 
  static DefaultWritable = DefaultValueModifier.writable

  constructor(descriptor) {
    assert(hasValue(descriptor))
    super(descriptor)
  }

  *modifiers() { 
    yield* super.modifiers()
    if (this.isWritable != Es6ValueDescriptorInfo.DefaultWritable)
      yield 'const'
  }
}

export class Es6DataDescriptorInfo extends Es6ValueDescriptorInfo {
  static Tag = 'data'
  static DefaultEnumerable = DefaultDataModifier.enumerable

  constructor(descriptor) {
    super(descriptor)
  }

  get type() { return Es6DataDescriptorInfo.Tag }

  *modifiers() { 
    yield* super.modifiers()
    if (this.isEnumerable != Es6DataDescriptorInfo.DefaultEnumerable)
      yield 'hidden'
  }
  
  toString() {
    const isEnumerableDefault = Es6DataDescriptorInfo.DefaultEnumerable
    return [
      ...this.modifiers(), '{',
      `value:`, `[${es6Typeof(this.value)}]`, '}'
    ].filter(Boolean).join(' ')
  }
}

export class Es6MethodDescriptorInfo extends Es6ValueDescriptorInfo { 
  static Tag = 'method'
  static DefaultEnumerable = DefaultMethodModifier.enumerable

  constructor(descriptor) {
    assert(typeof descriptor.value == 'function')
    assert(!descriptor.enumerable)
    super(descriptor)
  }

  get type() { return Es6MethodDescriptorInfo.Tag }

  *modifiers() { 
    yield* super.modifiers()
  }
  
  toString() {
    return [
      ...this.modifiers(),
      `function`,
    ].filter(Boolean).join(' ')
  }
}
