import { Functor } from '@kingjs/functor'

export class Refinery extends Functor {
  $() { return this.refine$(...arguments) }

  refine$() {
    // Abstract: to be implemented by subclasses
  }
}

export class RefineryPromise extends Refinery {
  then(...args) {
    return Promise.resolve()
      .then(() => this.test$())
      .then(...args)
  }

  catch(...args) {
    return Promise.resolve()
      .then(() => this.test$())
      .catch(...args)
  }

  finally(...args) {
    return Promise.resolve()
      .then(() => this.test$())
      .finally(...args)
  }

  test$() {
    // Abstract: to be implemented by subclasses
  }
}
