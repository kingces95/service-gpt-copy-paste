export class Container {
  
  #controllers
  #services
  #activateFn
  #produceFn
  #startFn
  #disposeFn

  constructor({ 
    activateFn = (class$, options) => { },
    produceFn = async (singleton) => { },
    startFn = (singleton) => { },
    disposeFn = (singleton) => { },
  }) {
    this.#services = new Map()
    this.#controllers = new Map()
    this.#activateFn = activateFn
    this.#disposeFn = disposeFn
    this.#produceFn = produceFn
    this.#startFn = startFn
  }

  activate(class$, options = { }) {
    if (!this.#services.has(class$)) {
      const activation = this.#activateFn(class$, options)

      if (activation instanceof Promise) {
        this.#controllers.set(class$, activation)
        this.#services.set(class$, activation.then(async () => {
          const controller = await activation
          this.#startFn(controller)
          const instance = await this.#produceFn(controller)
          return instance
        }))

      } else {
        const controller = activation
        this.#controllers.set(class$, controller)
        this.#startFn(controller)
        const instance = controller
        this.#services.set(class$, instance)
      }
    }
    return this.#services.get(class$)
  }

  async dispose(class$) {
    const singleton = await this.#controllers.get(class$)
    if (!singleton) return
    await this.#disposeFn(singleton)
    this.#services.delete(class$)
  }
}
