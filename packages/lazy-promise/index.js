export class LazyPromise {
  #loadFn
  #promise

  constructor(loadFn) {
    this.#loadFn = loadFn
    this.#promise = null
  }

  get value() {
    this.#promise ??= Promise.resolve().then(() => this.#loadFn())
    return this.#promise
  }

  then(...args) { return this.value.then(...args) }
  catch(...args) { return this.value.catch(...args) }
  finally(...args) { return this.value.finally(...args) }
}
