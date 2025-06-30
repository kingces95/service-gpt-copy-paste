import { Cursor } from '../cursor/cursor.js'

export class ContainerCursor extends Cursor {
  #__version
  #container

  constructor(container) {
    this.#container = container
    this.#initialize()
  }

  get isForward() { return true }

  __throwIfStale$() {
    if (!this.__isActive) throw new Error(
      "Container has been popped since cursor was created.")
  }

  get __isActive() {
    const container = this.#container
    const version = container.__version$
    return version == this.#__version
  }

  #initialize() {
    this.#__version = this.#container.__version$
  }

  get container$() { return this.#container }

  throwIfNotEquatable$(other) {
    if (!this.equatable(other))
      throw new Error("Cursor is not equatable to the other cursor.")
  }

  recycle$(container) {
    if (container != this.#container) 
      throw new Error("Cursor cannot be recycled to a different container.")

    const newVersion = container.__version$
    const oldVersion = this.#__version
    if (oldVersion !== undefined && newVersion == oldVersion) 
      throw new Error("Cursor cannot be recycled while still active.")
    this.#initialize()
  }

  equatable(other) {
    this.__throwIfStale$()
    if (!super.equatable(other)) return false
    return this.#container === other.#container
  }
}
