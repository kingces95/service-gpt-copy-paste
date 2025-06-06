import assert from 'assert'
import { Lazy } from '@kingjs/lazy'

export class Resource {
  static Unactivated = 'unactivated'
  static Activated = 'activated'
  static Disposed = 'disposed'
  static state = [
    Resource.Unactivated,
    Resource.Activated,
    Resource.Disposed
  ]

  #value
  #state
  #disposer
  #owned
  #__name

  constructor(valueFn, disposer, { end = true, __name } = { }) {
    this.#state = Resource.Unactivated
    this.#owned = end
    this.#disposer = disposer
    this.#value = new Lazy(() => {
      this.#state = Resource.Activated
      return valueFn()
    })
    this.#__name = __name
  }

  get __name() { return this.#__name }

  get state() { return this.#state }
  get isOwned() { return this.#owned }
  get isUnactivated() { return this.state === Resource.Unactivated }
  get isActivated() { return this.state === Resource.Activated }
  get isDisposed() { return this.state === Resource.Disposed }

  get value() { 
    if (this.isDisposed)
      throw new Error('Resource is disposed')
    return this.#value.value
  }

  async dispose({ signal, timeoutMs } = {}) {
    // TODO: move timeoutMs to disposer
    try {
      if (!this.isActivated) return
      if (!this.isOwned) return
      const { value: resource } = this
      await this.#disposer.dispose(resource, { signal, timeoutMs })
    }
    finally {
      this.#state = Resource.Disposed
    }
  }
} 
