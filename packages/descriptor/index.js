import { assert } from '@kingjs/assert'
import { isPojo } from '@kingjs/pojo-test'

class ValueDescriptor {
  static test(descriptor) {
    return descriptor != null && 'value' in descriptor
  }

  static formof(descriptor, shape) {
    assert(ValueDescriptor.test(descriptor))
    assert(shape == 'readable'
      || shape == 'writable'
      || shape == 'callable'
      || shape == 'mutable')

    const isReadable = true
    const isWritable = !!descriptor.writable

    switch (shape) {
      case 'readable': return isReadable
      case 'writable': return isWritable
      case 'mutable': return isReadable && isWritable
      case 'callable': return typeof descriptor.value == 'function'
    }
  }

  static getValue(descriptor) {
    assert(ValueDescriptor.test(descriptor))
    return descriptor.value
  }
}

class GetSetDescriptor {
  static test(descriptor) {
    return GetSetDescriptor.hasGetter(descriptor) 
      || GetSetDescriptor.hasSetter(descriptor)
  }

  static typeof(descriptor) {
    const hasGetter = GetSetDescriptor.hasGetter(descriptor)
    const hasSetter = GetSetDescriptor.hasSetter(descriptor)
    assert(hasGetter || hasSetter)

    if (hasGetter && hasSetter) return 'property'
    if (hasGetter) return 'getter'
    return 'setter'
  }

  static formof(descriptor, instance, shape) {
    assert(GetSetDescriptor.test(descriptor))
    assert(shape == 'readable'
      || shape == 'writable'
      || shape == 'callable'
      || shape == 'mutable')

    const isReadable = Descriptor.hasGetter(descriptor)
    const isWritable = Descriptor.hasSetter(descriptor)

    switch (shape) {
      case 'readable': return isReadable
      case 'writable': return isWritable
      case 'mutable': return isReadable && isWritable
      case 'callable':
        if (!isReadable) return false
        try {
          const value = descriptor.get.call(instance)
          return typeof value == 'function'
        } catch (error) {
          return false
        }
    }
  }

  static hasGetter(descriptor) {
    return descriptor?.get !== undefined
  }

  static hasSetter(descriptor) {
    return descriptor?.set !== undefined
  }

  static getValue(descriptor, instance) {
    assert(GetSetDescriptor.hasGetter(descriptor))
    return descriptor.get.call(instance)
  }
}

export class Descriptor {
  static get(prototype, key) {
    while (prototype) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, key)
      if (descriptor) return descriptor
      prototype = Object.getPrototypeOf(prototype)
    }
    return undefined
  }

  static typeof(descriptor) {
    return Descriptor.hasValue(descriptor)
      ? 'data' : GetSetDescriptor.typeof(descriptor)
  }

  static formof(descriptor, instance, shape) {
    return Descriptor.hasValue(descriptor)
      ? ValueDescriptor.formof(descriptor, shape)
      : GetSetDescriptor.formof(descriptor, instance, shape)
  }

  static hasValue(descriptor) {
    return ValueDescriptor.test(descriptor)
  }
  
  static hasGetter(descriptor) {
    return GetSetDescriptor.hasGetter(descriptor)
  }

  static hasSetter(descriptor) {
    return GetSetDescriptor.hasSetter(descriptor)
  }

  static hasAccessor(descriptor) {
    return GetSetDescriptor.test(descriptor)
  }

  static *modifiers(descriptor) {
    if (descriptor.configurable) yield 'configurable'
    if (descriptor.enumerable) yield 'enumerable'
    if (descriptor.writable) yield 'writable'
  }

  static getValue(descriptor, instance) {
    const type = Descriptor.typeof(descriptor)
    const value = ValueDescriptor.test(descriptor)
      ? ValueDescriptor.getValue(descriptor)
      : GetSetDescriptor.getValue(descriptor, instance)
    return { type, descriptor, value }
  }
}

export class PropertyDescriptor {
  static Type = 'property'
  static DefaultConfigurable = true
  static DefaultEnumerable = false
}
export class GetterDescriptor {
  static Type = 'getter'
  static DefaultConfigurable = true
  static DefaultEnumerable = false
}
export class SetterDescriptor {
  static Type = 'setter'
  static DefaultConfigurable = true
  static DefaultEnumerable = false
}
export class DataDescriptor {
  static Type = 'data'
  static DefaultConfigurable = true
  static DefaultEnumerable = true
  static DefaultWritable = true
}
