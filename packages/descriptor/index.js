import { assert } from '@kingjs/assert'
import { isPojo } from '@kingjs/pojo-test'

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
    const hasGetter = Descriptor.hasGetter(descriptor)
    const hasSetter = Descriptor.hasSetter(descriptor)
    const hasValue = Descriptor.hasValue(descriptor)

    if (hasValue) {
      assert(!hasGetter && !hasSetter,
        'Invalid descriptor: value and accessor are mutually exclusive.')
      return 'data'
    }

    assert(hasGetter || hasSetter,
      'Invalid descriptor: must have value or accessor.')
    if (!hasGetter) return 'setter'
    if (!hasSetter) return 'getter'
    return 'property'
  }

  static canSoundLike(descriptor, instance, sound) {
    assert(sound == 'readable' 
      || sound == 'writable' 
      || sound == 'callable'
      || sound == 'mutable')

    const type = Descriptor.typeof(descriptor)
    assert(type == 'data'
      || type == 'getter'
      || type == 'setter'
      || type == 'property')

    if (sound == 'mutable') 
      return Descriptor.canSoundLike(descriptor, instance, 'readable')
        && Descriptor.canSoundLike(descriptor, instance, 'writable')

    if (sound == 'readable') {
      if (type == 'data') return true
      if (type == 'getter') return true
      if (type == 'property') return true
      return false
    }

    if (sound == 'writable') {
      if (type == 'data' && descriptor.writable) return true
      if (type == 'setter') return true
      if (type == 'property') return true
      return false
    }

    assert(sound == 'callable')
    if (type == 'setter') return false

    assert(type == 'data'
      || type == 'getter'
      || type == 'property')

    try {
      const value = Descriptor.#getValue(descriptor, instance, type)
      return typeof value == 'function'
    } catch (error) {
      return false
    }
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
      ? Descriptor.#equalsData(lhs, rhs)
      : Descriptor.#equalsAccessor(lhs, rhs)
  }

  static #getValue(descriptor, instance, type) {
    assert(type == 'data'  
      || type == 'getter'
      || type == 'property')

    switch (type) {
      case 'data':
        return descriptor.value
      case 'getter':
      case 'property':
        return descriptor.get.call(instance)
    }
  }

  static getValue(descriptor, instance) {
    const type = Descriptor.typeof(descriptor)
    assert(type == 'data'  
      || type == 'getter'
      || type == 'property')

    return { descriptor, type,
      value: Descriptor.#getValue(descriptor, instance, type),
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
          const result = Descriptor.getValue(descriptor, instance)
          if (key) result.key = key
          if (host) result.host = host
          yield result
          break
        }
      }
    }
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
