import { assert } from '@kingjs/assert'
import { isPojo } from '@kingjs/pojo-test'

export class Descriptor {

  static typeof(descriptor) {
    const hasGetter = Descriptor.hasGetter(descriptor)
    const hasSetter = Descriptor.hasSetter(descriptor)
    const hasValue = Descriptor.hasValue(descriptor)

    if (hasValue) {
      assert(!hasGetter && !hasSetter,
        'Invalid descriptor: value and accessor are mutually exclusive.')
      return DataDescriptor.Type
    }

    assert(hasGetter || hasSetter,
      'Invalid descriptor: must have value or accessor.')
    if (!hasGetter) return SetterDescriptor.Type
    if (!hasSetter) return GetterDescriptor.Type
    return PropertyDescriptor.Type
  }

  static hasValue(descriptor) {
    if (!isPojo(descriptor)) return false
    return 'value' in descriptor
  }
  
  static hasGetter(descriptor) {
    if (!isPojo(descriptor)) return false
    if (!('get' in descriptor)) return false
    return descriptor.get !== undefined
  }

  static hasSetter(descriptor) {
    if (!isPojo(descriptor)) return false
    if (!('set' in descriptor)) return false
    return descriptor.set !== undefined
  }

  static hasAccessor(descriptor) {
    if (Descriptor.hasGetter(descriptor)) return true
    if (Descriptor.hasSetter(descriptor)) return true
    return false
  }

  // object instanceOf Descriptor - test if pojo and has value or accessor
  static [Symbol.hasInstance](instance) {
    const hasValue = Descriptor.hasValue(instance)
    const hasAccessor = Descriptor.hasAccessor(instance)
    return hasValue || hasAccessor
  }

  static hasExpectedModifiers(descriptor, expected) {
    if (!descriptor) return false
    for (const key of Object.keys(expected))
      if (!!descriptor[key] != expected[key]) return false
    return true
  }

  static *modifiers(descriptor) {
    if (descriptor.configurable) yield 'configurable'
    if (descriptor.enumerable) yield 'enumerable'
    if (descriptor.writable) yield 'writable'
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
