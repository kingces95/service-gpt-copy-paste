import { once } from 'events'

export class DisposableResource {
  #__name
  #value
  #valueOrFn
  #disposeFn
  #disposedEvent
  #end

  constructor(valueOrFn, disposeFn = () => {}, options = { end: true }) {
    const { end = true, disposedEvent, __name } = options
    this.#valueOrFn = valueOrFn
    this.#disposeFn = disposeFn
    this.#end = end
    this.#disposedEvent = disposedEvent
    this.#__name = __name
  }

  get __name() { return this.#__name }
  get value() { 
    if (this.#value === undefined) {
      this.#value = typeof this.#valueOrFn === 'function' 
        ? this.#valueOrFn() 
        : this.#valueOrFn
    }
    return this.#value
  }
  get isOwned() { return this.#end }

  async dispose() {
    if (this.#value === undefined) {
      this.#value = null
      return
    }

    if (!this.#end) return

    const { value } = this
    const disposedEvent = this.#disposedEvent
    const disposed = disposedEvent ? once(value, disposedEvent) : null
    await this.#disposeFn(value)
    if (disposed) await disposed
  }
}
