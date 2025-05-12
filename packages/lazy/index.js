export class Lazy {
  #load
  #value

  constructor(load) {
    this.#load = load
  }

  get value() {
    if (this.#value === undefined)
      this.#value = this.#load()
    return this.#value
  }
}

export class LazyGenerator extends Lazy {
  constructor(generator, scope) {
    super(() => [...generator.call(scope)])
  }
}

export function LazyFn(fn) {
  let called = false
  let result
  return function() {
    if (!called) {
      called = true
      result = fn()
    }
    return result
  }
}
