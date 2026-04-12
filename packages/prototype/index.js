export class Prototype {

  static *deconstruct(prototype) {
    yield *Prototype.chain(prototype).map(link => {
      const result = Object.create(null)
      Object.defineProperties(result,
        Object.getOwnPropertyDescriptors(link))
      return result
    })
  }

  static reduce(links) {
    // links like { type, descriptors }, subtype first
    return [...links].reverse().reduce((prototype, { type, descriptors }) => {
      prototype = Prototype.create(type, prototype, descriptors)
      return prototype
    }, null)
  }

  static create(type, basePrototype = null, descriptors = { }) {
    // add link to base prototype chain
    const prototype = Object.create(basePrototype)

    // define .constructor to be type
    Object.defineProperty(prototype, 'constructor', {
      value: type,
      configurable: true,
      enumerable: false,
      writable: false,
    })

    // define descriptors on prototype
    Object.defineProperties(prototype, descriptors)
    
    return prototype    
  }

  static *chain(prototype) {
    do { yield prototype } 
    while (prototype = Object.getPrototypeOf(prototype))
  }

  static hasOwnKey(prototype, name) {
    return Object.prototype.hasOwnProperty.call(prototype, name)
  }

  static hasKey(prototype, name) {
    return name in prototype
  }

  static *ownKeys(prototype) {
    yield* Reflect.ownKeys(prototype)
  }

  static getOwnDescriptor(prototype, name) {
    return Object.getOwnPropertyDescriptor(prototype, name)
  }
}
