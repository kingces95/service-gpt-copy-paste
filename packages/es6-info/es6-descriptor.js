import { 
  Descriptor,
  DataDescriptor,
  GetterDescriptor,
  SetterDescriptor,
  PropertyDescriptor,
} from '@kingjs/descriptor'

export class Es6Descriptor {

  static typeof(descriptor) {
    const type = Descriptor.typeof(descriptor)

    if (type == DataDescriptor.Type) {
      if (Es6Descriptor.hasMethod(descriptor))
        return Es6MethodDescriptor.Type
  
      return Es6FieldDescriptor.Type
    }

    return type
  }

  static #equalsData(lhs, rhs) {
    if (lhs.isWritable !== rhs.isWritable) return false
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

  static hasData(descriptor) {
    return Descriptor.hasValue(descriptor) 
      && !Es6Descriptor.hasMethod(descriptor)
  }

  static hasMethod(descriptor) {
    if (!Descriptor.hasValue(descriptor)) return false
    const fn = descriptor.value
    if (!(fn instanceof Function)) return false
    const prototypeDescriptor = Object.getOwnPropertyDescriptor(fn, 'prototype')
    if (Es6Descriptor.hasClassPrototypeDefaults(prototypeDescriptor)) return false
    if (descriptor.enumerable) return false
    return true
  }

  static get(prototype, property) {
    while (prototype) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, property)
      if (descriptor) return descriptor
      prototype = Object.getPrototypeOf(prototype)
    }
    return undefined
  }

  static {  
    Es6Descriptor.DefaultModifier = { }
    Es6Descriptor.DefaultModifier.userDefined = {
      configurable: true
    }
    Es6Descriptor.DefaultModifier.accessor = {
      ...Es6Descriptor.DefaultModifier.userDefined,
      enumerable: false,
    }

    Es6Descriptor.DefaultModifier.value = {
      ...Es6Descriptor.DefaultModifier.userDefined,
      writable: true,
    }
    Es6Descriptor.DefaultModifier.method = {
      ...Es6Descriptor.DefaultModifier.value,
      enumerable: false,
    }
    Es6Descriptor.DefaultModifier.data = {
      ...Es6Descriptor.DefaultModifier.value,
      enumerable: true,
    }

    Es6Descriptor.DefaultModifier.ptype = {
      enumerable: false,
      configurable: false,
      writable: false,
    }
  }

  // hasClassPrototypeDefaults checks if a prototype descriptor of a function
  // has a particular set of defaults which can be used to loosly determine 
  // if a class was declared using the class syntax. The defaults are:
  //  - enumerable: false, configurable: false, writable: false
  static hasClassPrototypeDefaults(prototypeDescriptor) {
    if (!prototypeDescriptor) return false
    if (!prototypeDescriptor.value) return false

    // if (prototypeDescriptor.enumerable) return false
    // if (prototypeDescriptor.configurable) return false
    // if (prototypeDescriptor.writable) return false
    const expected = Es6Descriptor.DefaultModifier.ptype
    if (!Descriptor.hasExpectedModifiers(prototypeDescriptor, expected))
      return false

    return true
  }
}

export class Es6FieldDescriptor {
  static Type = 'field'
  static DefaultConfigurable = true
  static DefaultEnumerable = true
  static DefaultWritable = true
}
export class Es6MethodDescriptor {
  static Type = 'method'
  static DefaultConfigurable = true
  static DefaultEnumerable = false
  static DefaultWritable = true
}
export class Es6GetterDescriptor {
  static Type = GetterDescriptor.Type
  static DefaultConfigurable = true
  static DefaultEnumerable = false
}
export class Es6SetterDescriptor {
  static Type = SetterDescriptor.Type
  static DefaultConfigurable = true
  static DefaultEnumerable = false
}
export class Es6PropertyDescriptor {
  static Type = PropertyDescriptor.Type
  static DefaultConfigurable = true
  static DefaultEnumerable = false
}

const TypeMap = new Map([
  [Es6FieldDescriptor.Type, Es6FieldDescriptor],
  [Es6MethodDescriptor.Type, Es6MethodDescriptor],
  [Es6GetterDescriptor.Type, Es6GetterDescriptor],
  [Es6SetterDescriptor.Type, Es6SetterDescriptor],
  [Es6PropertyDescriptor.Type, Es6PropertyDescriptor],
])
