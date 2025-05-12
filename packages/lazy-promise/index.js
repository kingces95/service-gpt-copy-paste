export class LazyPromise {
  #loadFn
  #resource

  constructor(loadFn) {
    this.#loadFn = async function() {
      if (!this.#resource) this.#resource = await loadFn.call(this)
      return this.#resource
    }
    this.#resource = null
  }

  then(...args) { return this.#loadFn().then(...args) }
  catch(...args) { return this.#loadFn().catch(...args) }
  finally(...args) { return this.#loadFn().finally(...args) }
}
