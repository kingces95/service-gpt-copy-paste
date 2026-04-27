import { assert } from '@kingjs/assert'
import { 
  Descriptor,
  DataDescriptor,
  GetterDescriptor,
  SetterDescriptor,
  PropertyDescriptor,
} from '@kingjs/descriptor'
import { es6Typeof } from '@kingjs/es6-typeof'

export class Es6Descriptor {

  static typeof(descriptor) {
    const type = Descriptor.typeof(descriptor)

    // return 'property', 'getter', 'setter'
    if (type != DataDescriptor.Type) 
      return type
      
    // map 'data' to 'field' or 'method'    
    const valueType = es6Typeof(descriptor.value)
    if (valueType == 'function' && descriptor.enumerable == false)
      return Es6MethodDescriptor.Type

    return Es6FieldDescriptor.Type
  }

  static shapeof(descriptor) {
    const type = Es6Descriptor.typeof(descriptor)
    assert(type == 'getter'
      || type == 'setter'
      || type == 'method'
      || type == 'property'
      || type == 'field')

    if (type == 'getter') return 'readable'
    if (type == 'setter') return 'writable'
    if (type == 'property') return 'mutable'
    if (type == 'method') return 'callable'
    
    assert(type == 'field')
    if (descriptor.writable == false) 
      return 'readable'
    return 'mutable'
  }

  static formof(descriptor, shape) {
    assert(shape == 'readable' 
      || shape == 'writable' 
      || shape == 'callable'
      || shape == 'mutable')

    const sound = Es6Descriptor.shapeof(descriptor)
    if (sound == shape) 
      return true

    if (sound == 'mutable') 
      return shape == 'readable' || shape == 'writable'

    return false
  }

  static promoteValue(result, instance) {
    
    // promote type
    const type = Es6Descriptor.typeof(result.descriptor)
    result.type = type
    
    // promote value
    if (type == 'method')
      result.value = result.value.call(instance)

    return result
  }

  static getValue(descriptor, instance) {
    const result = Descriptor.getValue(descriptor, instance)
    return Es6Descriptor.promoteValue(result, instance)
  }
  
  static *modifiers(
    descriptor, 
    md = TypeMap.get(Es6Descriptor.typeof(descriptor))) { 

    if (descriptor.configurable == false)
      yield 'sealed'

    if (descriptor.writable == false)
      yield 'const'

    if (descriptor.enumerable != md.DefaultEnumerable 
      && descriptor.enumerable == true)
      yield 'visible'

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
