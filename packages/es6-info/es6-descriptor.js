import { 
  Descriptor,
  DataDescriptor,
  GetterDescriptor,
  SetterDescriptor,
  PropertyDescriptor,
} from '@kingjs/descriptor'
import { es6Typeof } from './es6-typeof.js'

export class Es6Descriptor {

  static typeof(descriptor) {
    const type = Descriptor.typeof(descriptor)

    if (type != DataDescriptor.Type) 
      return type
      
    const valueType = es6Typeof(descriptor.value)
    if (valueType == 'function' && descriptor.enumerable == false)
      return Es6MethodDescriptor.Type

    return Es6FieldDescriptor.Type
  }

  static #equalsData(lhs, rhs) {
    if (lhs.writable !== rhs.writable) return false
    if (lhs.value == rhs.value) return true
    if (Number.isNaN(lhs.value) && Number.isNaN(rhs.value)) return true
    return false
  }
  static #equalsAccessor(lhs, rhs) {
    if (lhs.get !== rhs.get) return false
    if (lhs.set !== rhs.set) return false
    return true
  }
  static equals(lhs, rhs) {
    const lhsType = Descriptor.typeof(lhs)
    const rhsType = Descriptor.typeof(rhs)
    if (lhsType != rhsType) return false

    if (lhs.configurable !== rhs.configurable) return false
    if (lhs.enumerable !== rhs.enumerable) return false

    return lhsType == 'data'
      ? Es6Descriptor.#equalsData(lhs, rhs)
      : Es6Descriptor.#equalsAccessor(lhs, rhs)
  }

  static get(prototype, property) {
    while (prototype) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, property)
      if (descriptor) return descriptor
      prototype = Object.getPrototypeOf(prototype)
    }
    return undefined
  }
  
  static *modifiers(
    descriptor, 
    md = TypeMap.get(Es6Descriptor.typeof(descriptor))) { 

    if (descriptor.configurable != md.DefaultConfigurable 
      && descriptor.configurable == false)
      yield 'sealed'

    if ('writable' in descriptor 
      && descriptor.writable != md.DefaultWritable 
      && descriptor.writable == false)
      yield 'const'

    if (descriptor.enumerable != md.DefaultEnumerable 
      && descriptor.enumerable == true)
      yield 'enumerable'

    if (descriptor.enumerable != md.DefaultEnumerable 
      && !descriptor.enumerable == true)
      yield 'hidden'
  }
}

export class Es6FieldDescriptor {
  static Type = 'field'
  static DefaultConfigurable = DataDescriptor.DefaultConfigurable
  static DefaultWritable = DataDescriptor.DefaultWritable
  static DefaultEnumerable = true
}
export class Es6MethodDescriptor {
  static Type = 'method'
  static DefaultConfigurable = DataDescriptor.DefaultConfigurable
  static DefaultWritable = DataDescriptor.DefaultWritable
  static DefaultEnumerable = false
}
export class Es6GetterDescriptor {
  static Type = GetterDescriptor.Type
  static DefaultConfigurable = GetterDescriptor.DefaultConfigurable
  static DefaultEnumerable = GetterDescriptor.DefaultEnumerable
}
export class Es6SetterDescriptor {
  static Type = SetterDescriptor.Type
  static DefaultConfigurable = GetterDescriptor.DefaultConfigurable
  static DefaultEnumerable = GetterDescriptor.DefaultEnumerable
}
export class Es6PropertyDescriptor {
  static Type = PropertyDescriptor.Type
  static DefaultConfigurable = GetterDescriptor.DefaultConfigurable
  static DefaultEnumerable = GetterDescriptor.DefaultEnumerable
}

const TypeMap = new Map([
  [Es6FieldDescriptor.Type, Es6FieldDescriptor],
  [Es6MethodDescriptor.Type, Es6MethodDescriptor],
  [Es6GetterDescriptor.Type, Es6GetterDescriptor],
  [Es6SetterDescriptor.Type, Es6SetterDescriptor],
  [Es6PropertyDescriptor.Type, Es6PropertyDescriptor],
])
