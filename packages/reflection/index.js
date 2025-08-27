export class Reflection {
  static isExtensionOf(childClass, parentClass) {
    let prototype = childClass
    while (prototype) {
      if (prototype === parentClass) return true
      prototype = Object.getPrototypeOf(prototype)
    }
    return false;
  }

  static *names(prototype, root = Object) {
    const names = new Set()
    while (prototype != root.prototype) {
      for (const name of Object.getOwnPropertyNames(prototype)) {
        if (names.has(name)) continue
        yield name
        names.add(name)
      }
      prototype = Object.getPrototypeOf(prototype)
    }
  }

  static *symbols(prototype, root = Object) {
    const symbols = new Set()
    while (prototype != root.prototype) {
      for (const symbol of Object.getOwnPropertySymbols(prototype)) {
        if (symbols.has(symbol)) continue
        yield symbol
        symbols.add(symbol)
      } 
      prototype = Object.getPrototypeOf(prototype)
    }
  }

  static *namesAndSymbols(prototype, root = Object) {
    yield* Reflection.names(prototype, root)
    yield* Reflection.symbols(prototype, root)
  }

  static *memberNamesAndSymbols(prototype, root = Object) {
    // names and symbols of members only (exclude constructor)
    for (const name of Reflection.namesAndSymbols(prototype, root)) {
      if (name === 'constructor') continue
      yield name
    }
  }
}
