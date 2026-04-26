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

  static soundof(descriptor) {
    const type = Es6Descriptor.typeof(descriptor)
    assert(type == 'getter'
      || type == 'setter'
      || type == 'method'
      || type == 'property'
      || type == 'field')

    if (type == 'method') return 'callable'
    if (type == 'getter') return 'readable'
    if (type == 'setter') return 'writable'
    if (type == 'property') return 'mutable'
    
    assert(type == 'field')
    return 'mutable'
  }

  static canSoundLike(descriptor, sound) {
    assert(sound == 'readable' 
      || sound == 'writable' 
      || sound == 'callable'
      || sound == 'mutable')

    const type = Es6Descriptor.typeof(descriptor)
    assert(type == 'field'
      || type == 'method'
      || type == 'getter'
      || type == 'setter'
      || type == 'property')

    if (sound == 'mutable') 
      return Es6Descriptor.canSoundLike(descriptor, 'readable')
        && Es6Descriptor.canSoundLike(descriptor, 'writable')

    if (sound == 'readable') {
      if (type == 'field') return true
      if (type == 'getter') return true
      if (type == 'property') return true
      return false
    }

    if (sound == 'writable') {
      if (type == 'field' && descriptor.writable) return true
      if (type == 'setter') return true
      if (type == 'property') return true
      return false
    }

    assert(sound == 'callable')
    return type == 'method'
  }

  static equals(lhs, rhs) {
    return Descriptor.equals(lhs, rhs)
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

  static *values(descriptors, instance) {
    for (const result of Descriptor.values(descriptors, instance))
      yield Es6Descriptor.promoteValue(result, instance)
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
