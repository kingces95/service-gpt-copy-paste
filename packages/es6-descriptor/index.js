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

  static equals(lhs, rhs) {
    return Descriptor.equals(lhs, rhs)
  }

  static getValue(descriptor, instance) {
    const type = Es6Descriptor.typeof(descriptor)
    assert(type == Es6FieldDescriptor.Type 
      || type == Es6MethodDescriptor.Type
      || type == Es6GetterDescriptor.Type
      || type == Es6PropertyDescriptor.Type)

    switch (type) {
      case Es6FieldDescriptor.Type:
        return descriptor.value
      case Es6MethodDescriptor.Type:
        return descriptor.value.call(instance)
      case Es6GetterDescriptor.Type:
        return descriptor.get.call(instance)
      case Es6PropertyDescriptor.Type:
        return descriptor.get.call(instance)
    }
  }

  static *values(descriptors, instance) {

    let key
    let host
    for (const current of descriptors) {
      assert(typeof current == 'object'
        || typeof current == 'function'
        || typeof current == 'string'
        || typeof current == 'symbol')

      switch (typeof current) {
        case 'function':
          host = current 
          break

        case 'string':
        case 'symbol':
          key = current
          break

        case 'object': {
          const descriptor = current
          const value = Es6Descriptor.getValue(descriptor, instance)
          const result = { value }
          if (key) result.key = key
          if (host) result.host = host
          yield result
          break
        }
      }
    }
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

  static canDuckCast(expectedDescriptor, actualDescriptor) {
    const actualType = Es6Descriptor.typeof(actualDescriptor)
    const expectedType = Es6Descriptor.typeof(expectedDescriptor)
    if (actualType == expectedType) return true
    if (actualType == 'field') {
      if (expectedType == 'getter') return true
    }
    if (actualType == 'property') {
      if (expectedType == 'getter') return true
      if (expectedType == 'setter') return true
    }
    return false
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
