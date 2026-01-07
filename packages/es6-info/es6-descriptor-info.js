import { assert } from '@kingjs/assert'
import { Descriptor } from "@kingjs/descriptor"
import { es6Typeof } from "./es6-typeof.js"
import { isAbstract } from "@kingjs/abstract"

const {  
  hasValue,
  hasAccessor,
  hasGetter,
  hasSetter,
  DefaultModifier,
} = Descriptor

const {
  userDefined: DefaultUserDefinedModifier,
  accessor: DefaultAccessorModifier,
  value: DefaultValueModifier,
} = DefaultModifier

export class Es6DescriptorInfo {
  static create(descriptor) {
    
    // accessor descriptor (no value)
    if (!hasValue(descriptor)) {
      assert(hasAccessor(descriptor))

      if (!hasSetter(descriptor))
        return new Es6GetterDescriptorInfo(descriptor)

      if (!hasGetter(descriptor))
        return new Es6SetterDescriptorInfo(descriptor)
      
      return new Es6PropertyDescriptorInfo(descriptor)
    }

    // value descriptor (has value)
    assert(hasValue(descriptor))
    return new Es6DataDescriptorInfo(descriptor)
  }

  #descriptor

  constructor(descriptor) {
    this.#descriptor = descriptor
  }

  get descriptor() { return this.#descriptor }
  get returnType() {
    if (this.isData) return es6Typeof(this.value)
    return 'object'
  }

  get type() { return this.constructor.Type }
  get isGetter() { return this instanceof Es6GetterDescriptorInfo }
  get isSetter() { return this instanceof Es6SetterDescriptorInfo }
  get isProperty() { return this instanceof Es6PropertyDescriptorInfo }
  get isAccessor() { return this.isGetter || this.isSetter || this.isProperty }
  get isData() { return this instanceof Es6DataDescriptorInfo }

  // pivots
  get isAbstract() { return isAbstract(this.#descriptor) }
  
  // values
  get getter() { return this.descriptor.get }
  get setter() { return this.descriptor.set }
  get value() { return this.descriptor.value }
  
  // modifiers
  get isEnumerable() { return this.descriptor.enumerable }
  get isConfigurable() { return this.descriptor.configurable }
  get isWritable() { return !!this.descriptor.writable }

  #equalsData(other) {
    if (this.isWritable !== other.isWritable) return false

    if (this.value !== other.value) {
      if (!(Number.isNaN(this.value) && Number.isNaN(other.value))) 
        return false
    }

    return true
  }
  #equalsAccessor(other) {
    const a = this.descriptor
    const b = other.descriptor
    
    if (a.get !== b.get) return false
    if (a.set !== b.set) return false
    return true
  }
  #equalsModifier(other) {
    const a = this.descriptor
    const b = other.descriptor

    if (a.configurable !== b.configurable) return false
    if (a.enumerable !== b.enumerable) return false
    return true
  }
  #equalsBasic(other) {
    if (!(other instanceof Es6DescriptorInfo)) return false
    if (this.type != other.type) return false
    return true
  }
  equals(other) {
    if (!this.#equalsBasic(other)) return false
    if (!this.#equalsModifier(other)) return false
    if (this.isAccessor) return this.#equalsAccessor(other)
    return this.#equalsData(other)
  }

  *pivots() {
    if (this.isAbstract) yield 'abstract'
  }
  *modifiers() {
    if (this.isConfigurable) yield 'configurable'
    if (this.isEnumerable) yield 'enumerable'
    if (this.isData && this.isWritable) yield 'writable'
  }

  toStringType() {
    if (this.isData) return this.returnType
    return this.type
  }
  toString() {
    return [
      // e.g. 'abstract'
      ...this.pivots(), 

      // e.g. 'configurable', 'enumerable', 'writable'
      ...this.modifiers(),

      // e.g. 'getter', 'setter', 'property'
      // or when value 'string', 'number', 'function', 'array' etc.
      this.toStringType(), 

    ].filter(Boolean).join(' ')
  }
}

export class Es6GetterDescriptorInfo extends Es6DescriptorInfo {
  static Type = 'getter'
  static DefaultConfigurable = DefaultUserDefinedModifier.configurable
  static DefaultEnumerable = DefaultAccessorModifier.enumerable
}
export class Es6SetterDescriptorInfo extends Es6DescriptorInfo {
  static Type = 'setter'
  static DefaultConfigurable = DefaultUserDefinedModifier.configurable
  static DefaultEnumerable = DefaultAccessorModifier.enumerable
}
export class Es6PropertyDescriptorInfo extends Es6DescriptorInfo {
  static Type = 'property'
  static DefaultConfigurable = DefaultUserDefinedModifier.configurable
  static DefaultEnumerable = DefaultAccessorModifier.enumerable
}
export class Es6DataDescriptorInfo extends Es6DescriptorInfo { 
  static Type = 'data'
  static DefaultConfigurable = DefaultUserDefinedModifier.configurable
  static DefaultWritable = DefaultValueModifier.writable
}

