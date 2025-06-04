import { once } from 'events'

export class DisposableResource {
  #__name
  #value
  #valueFn
  #disposeFn
  #end

  constructor(
    valueOrFn, 
    disposeFn = () => true, 
    options = { end: true }) {

    const { end = true, __name } = options
    if (typeof valueOrFn !== 'function')
      this.#value = valueOrFn
    else
      this.#valueFn = valueOrFn
  
    this.#disposeFn = disposeFn
    this.#end = end
    this.#__name = __name
  }

  get __name() { return this.#__name }
  get value() { 
    if (this.#value === undefined)
      this.#value = this.#valueFn() 
    return this.#value
  }
  get isOwned() { return this.#end }
  get isDisposed() { return this.#value === null }
  get disposedEvent() { }

  async dispose(signal) {
    // resource was never created
    if (this.#value === undefined) {

      // prevent any further attempts to create resource
      this.#value = null
      return true
    }
    
    // resource is already disposed
    if (this.isDisposed) return true

    // resource is not owned
    if (!this.isOwned) return true

    const { value, disposedEvent } = this

    // no disposal event
    if (!disposedEvent) {
      this.#disposeFn(value)
      return true
    }

    // synchronize with disposal event
    const disposed = once(value, disposedEvent)
    await this.#disposeFn(value)

    let aborted = false
    let handler = null
    const abort = new Promise(
      resolve => signal?.addEventListener('abort', handler = resolve)
    ).then(() => { aborted = true })
    try { await Promise.any([ disposed, abort ]) } 
    finally { signal?.removeEventListener('abort', handler) }
    return !aborted
  }
}
