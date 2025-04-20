export class Functor {
  constructor(fn) {
    const self = function (...args) {
      return fn.apply(self, args)
    }
    Object.setPrototypeOf(self, new.target.prototype)
    self.constructor = new.target
    return self
  }
}