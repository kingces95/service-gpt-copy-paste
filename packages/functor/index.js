export class Functor {
  constructor() {
    const self = function (...args) {
      return self.$(...args)
    }
    const prototype = new.target.prototype
    Object.setPrototypeOf(self, prototype)
    self.constructor = new.target

    if ('name' in prototype) {
      const { get } = Object.getOwnPropertyDescriptor(prototype, 'name')
      
      // bypass function.name
      Object.defineProperty(self, 'name', {
        get() { return get.call(self) },
        enumerable: false,
        configurable: true
      })
    }

    return self
  }
  
  $() { }
}
