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
    while (prototype != root.prototype) {
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
}
