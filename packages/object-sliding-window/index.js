import Denque from "denque"
import { SlidingWindow, BidirectionalCursor } from "@kingjs/cursor"

export class ObjectSlidingWindow extends SlidingWindow {
  static get Cursor() { return ObjectSlidingWindowCursor }

  #denque

  constructor() {
    super()
    this.#denque = new Denque()
  }

  get$(innerIndex) { return this.#denque.get(innerIndex) }
  
  get count() {
    this.__throwIfDisposed$() 
    return this.#denque.length 
  }
  get isEmpty() { return this.count === 0 }

  begin(recyclable) {
    super.begin(recyclable)
    return this.cursor$(recyclable, 0)
  }
  end(recyclable) {
    super.end(recyclable)
    return this.cursor$(recyclable, this.#denque.length)
  }

  push(chunk) { 
    super.push(chunk)
    const isObject = typeof chunk === 'object'
    const isArray = Array.isArray(chunk)
    if (!isObject && !isArray) throw new Error(
      "Chunk must be an object or an array.")

    if (!Array.isArray(chunk)) {
      this.#denque.push(chunk)
    }
    else {
      for (let i = 0; i < chunk.length; i++) {
        if (chunk[i] == null) throw new Error(
          "Chunk elements cannot be null or undefined.")
        this.#denque.push(chunk[i])
      }
    }
  }
  shift(cursor = this.end()) {
    super.shift(cursor)
    const result = []
    const innerIndex = cursor.innerIndex$
    for (let i = 0; i < innerIndex; i++)
      result.push(this.#denque.shift())
    super.shift(cursor)
    return result
  }

  dispose() {
    const result = this.shift()
    super.dispose()
    this.#denque.clear()
    this.#denque = null
    return result
  }
}

export class ObjectSlidingWindowCursor extends BidirectionalCursor {
  #window
  #innerIndex

  constructor(window, innerIndex) {
    super(window)
    this.#window = window
    this.#initialize(innerIndex)
  }

  #initialize(innerIndex) {
    this.#innerIndex = innerIndex
  }

  recycle$(window, innerIndex) {
    super.recycle$(window)
    this.#initialize(innerIndex)
    return this
  }

  get window$() { return this.#window }
  get innerIndex$() { return this.#innerIndex }

  get isEnd() { 
    this.__throwIfStale$()
    const { 
      window$: window, 
      innerIndex$: innerIndex 
    } = this
    return innerIndex === window.count
  }
  get isBegin() { 
    this.__throwIfStale$()
    const { 
      innerIndex$: innerIndex 
    } = this
    return innerIndex === 0 
  }
  get value() {
    this.__throwIfStale$()
    if (this.isEnd) return null
    return this.#window.get$(this.#innerIndex)
  }

  step() {
    this.__throwIfStale$()
    if (this.isEnd) return false
    this.#innerIndex++
    return true
  }

  stepBack() {
    this.__throwIfStale$()
    if (this.#innerIndex == 0) return false
    this.#innerIndex--
    return true
  }

  clone() {
    this.__throwIfStale$()
    const { 
      window$: window, 
      innerIndex$: innerIndex 
    } = this
    return new ObjectSlidingWindowCursor(window, innerIndex)
  }

  equals(other) {
    this.__throwIfStale$()
    const { 
      window$: window, 
      innerIndex$: index 
    } = this
    const { 
      window$: otherWindow, 
      innerIndex$: otherIndex 
    } = other

    if (window !== otherWindow) return false
    if (index != otherIndex) return false
    return true
  }
}
