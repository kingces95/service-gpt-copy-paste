export class Reflection {
  static baseOf(type) {
    return Object.getPrototypeOf(type.prototype)?.constructor
  }

  static* hierarchy(type) {
    for (let current = type; current; current = Reflection.baseOf(current))
      yield current
  }

  static link(prototypes) {
    return prototypes.reverse().reduce((reduction, prototype) => {
      return Object.setPrototypeOf(prototype, reduction)
    }, { })
  }

  static *names(prototype, root = Object) {
    const rootPrototype = root.prototype
    while (prototype != rootPrototype) {
      for (const name of Object.getOwnPropertyNames(prototype))
        yield name
      prototype = Object.getPrototypeOf(prototype)
    }
  }

  static *symbols(prototype, root = Object) {
    while (prototype != root.prototype) {
      for (const symbol of Object.getOwnPropertySymbols(prototype)) 
        yield symbol
      prototype = Object.getPrototypeOf(prototype)
    }
  }

  static *namesAndSymbols(prototype, root = Object) {
    yield* Reflection.names(prototype, root)
    yield* Reflection.symbols(prototype, root)
  }

  static getDescriptor(prototype, property) {
    while (prototype) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, property)
      if (descriptor) return descriptor
      prototype = Object.getPrototypeOf(prototype)
    }
    return undefined
  }

  static isDataDescriptor(descriptor) {
    if (!descriptor) return false
    return descriptor.hasOwnProperty('value') || 
          descriptor.hasOwnProperty('writable')
  }

  static toDescriptor(descriptorOrFunction) {

    // return a descriptor with properties matching those of a function
    // declared in source code (e.g. enumerable, configurable, writable)
    if (typeof descriptorOrFunction === 'function') {
      descriptorOrFunction = {
        value: descriptorOrFunction,
      }
    }

    // defaults for data descriptors and accessors are the same
    if (!('enumerable' in descriptorOrFunction))
      descriptorOrFunction.enumerable = false
    if (!('configurable' in descriptorOrFunction))
      descriptorOrFunction.configurable = true

    // if the descriptor is a data descriptor, ensure it is writable
    if ('value' in descriptorOrFunction) {
      if (!('writable' in descriptorOrFunction))
        descriptorOrFunction.writable = true
    }

    return descriptorOrFunction
  }
}
