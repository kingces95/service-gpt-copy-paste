export class Functor {
  constructor() {
    const self = function (...args) {
      return self.$(...args)
    }
    Object.setPrototypeOf(self, new.target.prototype)
    self.constructor = new.target
    return self
  }
  
  $() { }
}
