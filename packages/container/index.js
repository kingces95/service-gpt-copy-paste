export class Container {
  
  #singletons
  #activateFn
  #activatedFn
  #activatedSyncFn
  #disposeFn

  constructor({ 
    activateFn = (class$, options) => { },
    activatedFn = async (singleton) => { },
    activatedSyncFn = (singleton) => { },
    disposeFn = (singleton) => { },
  }) {
    this.#singletons = new Map()
    this.#activateFn = activateFn
    this.#disposeFn = disposeFn
    this.#activatedFn = activatedFn
    this.#activatedSyncFn = activatedSyncFn
  }

  activate(class$, options = { }) {
    if (!this.#singletons.has(class$)) {
      const instance = this.#activateFn(class$, options)
      this.#singletons.set(class$, instance instanceof Promise
        ? instance.then(this.#activatedFn).then(this.#activatedSyncFn) 
        : this.#activatedSyncFn(instance))
    }
    return this.#singletons.get(class$)
  }

  async dispose(class$) {
    const singleton = this.#singletons.get(class$)
    if (!singleton) return
    await this.#disposeFn(singleton)
    this.#singletons.delete(class$)
  }
}
