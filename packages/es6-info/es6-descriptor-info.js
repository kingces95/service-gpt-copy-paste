import { assert } from "@kingjs/assert"
import { isAbstract } from "@kingjs/abstract"
import { es6Typeof } from '@kingjs/es6-typeof'
import { 
  Es6Descriptor,
  Es6FieldDescriptor,
  Es6MethodDescriptor,
  Es6GetterDescriptor,
  Es6SetterDescriptor,
  Es6PropertyDescriptor, 
} from '@kingjs/es6-descriptor'

export class Es6DescriptorInfo {
  static create(descriptor) {
    const type = Es6Descriptor.typeof(descriptor)
    const ctor = TypeMap.get(type)
    assert(ctor, `Unknown descriptor type.`)
    return new ctor(descriptor)
  }

  #descriptor

  constructor(descriptor) {
    this.#descriptor = descriptor
  }

  get descriptor() { return this.#descriptor }
  get fieldType() {
    if (!this.isField) return null
    return es6Typeof(this.value)
  }

  get type() { return this.constructor.Type }
  get isGetter() { return this instanceof Es6GetterDescriptorInfo }
  get isSetter() { return this instanceof Es6SetterDescriptorInfo }
  get isProperty() { return this instanceof Es6PropertyDescriptorInfo }
  get isAccessor() { return this.isGetter || this.isSetter || this.isProperty }
  get isMethod() { return this instanceof Es6MethodDescriptorInfo }
  get isField() { return this instanceof Es6FieldDescriptorInfo }
  get isData() { return this.isMethod || this.isField }
  
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

  equals(other) {
    if (!(other instanceof Es6DescriptorInfo)) return false
    return Es6Descriptor.equals(this.descriptor, other.descriptor)
  }

  *pivots() {
    if (this.isAbstract) yield 'abstract'
  }
  *modifiers() { yield* Es6Descriptor.modifiers(this.descriptor) }

  toString() {
    return [
      // e.g. 'abstract'
      ...this.pivots(), 

      // e.g. 'const', 'visible', 'hidden', 'sealed'
      ...this.modifiers(),

      // e.g. 'getter', 'setter', 'property', 'method', 'field'
      this.type,

      // 'string', 'number', 'function', 'array' etc.
      this.fieldType ? `[${this.fieldType}]` : null,   

    ].filter(Boolean).join(' ')
  }
}

export class Es6PropertyDescriptorInfo extends Es6DescriptorInfo {
  static Type = 'property'
  static DefaultConfigurable = Es6PropertyDescriptor.DefaultConfigurable
  static DefaultEnumerable = Es6PropertyDescriptor.DefaultEnumerable
}
export class Es6GetterDescriptorInfo extends Es6DescriptorInfo {
  static Type = 'getter'
  static DefaultConfigurable = Es6GetterDescriptor.DefaultConfigurable
  static DefaultEnumerable = Es6GetterDescriptor.DefaultEnumerable
}
export class Es6SetterDescriptorInfo extends Es6DescriptorInfo {
  static Type = 'setter'
  static DefaultConfigurable = Es6SetterDescriptor.DefaultConfigurable
  static DefaultEnumerable = Es6SetterDescriptor.DefaultEnumerable
}
export class Es6MethodDescriptorInfo extends Es6DescriptorInfo {
  static Type = 'method'
  static DefaultConfigurable = Es6MethodDescriptor.DefaultConfigurable
  static DefaultEnumerable = Es6MethodDescriptor.DefaultEnumerable
  static DefaultWritable = Es6MethodDescriptor.DefaultWritable
}
export class Es6FieldDescriptorInfo extends Es6DescriptorInfo {
  static Type = 'field'
  static DefaultConfigurable = Es6FieldDescriptor.DefaultConfigurable
  static DefaultEnumerable = Es6FieldDescriptor.DefaultEnumerable
  static DefaultWritable = Es6FieldDescriptor.DefaultWritable
}

const TypeMap = new Map([
  [Es6FieldDescriptorInfo.Type, Es6FieldDescriptorInfo],
  [Es6MethodDescriptorInfo.Type, Es6MethodDescriptorInfo],
  [Es6GetterDescriptorInfo.Type, Es6GetterDescriptorInfo],
  [Es6SetterDescriptorInfo.Type, Es6SetterDescriptorInfo],
  [Es6PropertyDescriptorInfo.Type, Es6PropertyDescriptorInfo],
])