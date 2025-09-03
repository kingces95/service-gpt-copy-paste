import { assert } from '@kingjs/assert'
import { dispose } from '@kingjs/dispose'

export class Disposer {
  #disposeFn
  #disposedFn
  #event

  constructor(
    disposeFn = () => { }, { 
      disposedFn,
      event,
    } = { }) {
    
    this.#disposeFn = disposeFn
    this.#disposedFn = disposedFn
    this.#event = event
  }

  get event() { return this.#event }
  get disposeFn() { return this.#disposeFn }
  get disposedFn() { return this.#disposedFn }

  async dispose(resource, { signal, timeoutMs } = {}) {
    await dispose(resource, {
      event: this.#event,
      disposeFn: this.#disposeFn,
      disposedFn: this.#disposedFn,
      signal,
      timeoutMs
    })
  }
}
