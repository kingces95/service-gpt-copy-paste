import { isPojo } from '@kingjs/pojo-test'

export class Descriptor {
  
  static hasGetter(descriptor) {
    if (!descriptor) return false
    return 'get' in descriptor && descriptor.get !== undefined
  }

  static hasSetter(descriptor) {
    if (!descriptor) return false
    return 'set' in descriptor && descriptor.set !== undefined
  }

  static hasAccessor(descriptor) {
    if (!descriptor) return false
    return Descriptor.hasGetter(descriptor) || 
      Descriptor.hasSetter(descriptor)
  }

  static hasValue(descriptor) {
    if (!descriptor) return false
    return 'value' in descriptor
  }

  static hasData(descriptor) {
    return Descriptor.hasValue(descriptor) && !Descriptor.hasMethod(descriptor)
  }

  static hasMethod(descriptor) {
    if (!Descriptor.hasValue(descriptor)) return false
    const fn = descriptor.value
    if (!(fn instanceof Function)) return false
    const prototypeDescriptor = Object.getOwnPropertyDescriptor(fn, 'prototype')
    return !Descriptor.hasClassPrototypeDefaults(prototypeDescriptor)
  }

  static *implementation(descriptor) {
    if (!descriptor)
      return
    
    if (descriptor.get) 
      yield descriptor.get

    if (descriptor.set) 
      yield descriptor.set

    if (Descriptor.hasMethod(descriptor))
      yield descriptor.value
  }

  // object instanceOf Descriptor - test if pojo and has value or accessor
  static [Symbol.hasInstance](instance) {
    if (!isPojo(instance)) return false
    if (Descriptor.hasValue(instance)) return true
    if (Descriptor.hasAccessor(instance)) return true
    return false
  }

  static get(prototype, property) {
    while (prototype) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, property)
      if (descriptor) return descriptor
      prototype = Object.getPrototypeOf(prototype)
    }
    return undefined
  }

  // hasClassPrototypeDefaults checks if a prototype descriptor of a function
  // has a particular set of defaults which can be used to loosly determine 
  // if class was declared using the class syntax. The defaults are:
  //  - enumerable: false, configurable: false, writable: false
  static hasClassPrototypeDefaults(prototypeDescriptor) {
    if (!prototypeDescriptor) return false
    if (!prototypeDescriptor.value) return false
    if (prototypeDescriptor.enumerable) return false
    if (prototypeDescriptor.configurable) return false
    if (prototypeDescriptor.writable) return false
    return true
  }

  // hasMemberDeclarationDefaults checks if a descriptor has the defaults:
  //  - Accessors: enumerable: false, configurable: true
  //  - Methods: enumerable: false, configurable: true, writable: true
  //  - Data: enumerable: true, configurable: true, writable: true
  static hasMemberDeclarationDefaults(descriptor) {
    if (!descriptor) return false
    if (!descriptor.configurable) return false
    if (Descriptor.hasValue(descriptor)) {
      if (!descriptor.writable) return false
      if (descriptor.enumerable) return false
    } else {
      if (descriptor.enumerable) return false
    }
    return true
  }
}
