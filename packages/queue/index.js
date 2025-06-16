import Denque from "denque"
import { AbstractQueue, BidirectionalCursor } from "@kingjs/cursor"

export class Queue extends AbstractQueue {
  static get Cursor() { return QueueCursor }

  #denque

  constructor() {
    super()
    this.#denque = new Denque()
  }

  get count() { return this.#denque.length }
  get$(innerIndex) { return this.#denque.get(innerIndex) }
  
  get isEmpty() { return this.count === 0 }

  begin(recyclable) { 
    return this.cursor$(recyclable, 0)
  }
  end(recyclable) {
    return this.cursor$(recyclable, this.#denque.length)
  }

  push(value) { 
    if (value === null) 
      throw new Error("Cannot push null to a queue.")
    if (value === undefined)
      throw new Error("Cannot push undefined to a queue.")
    this.#denque.push(value) 
  }
  pop(cursor = this.end()) {
    const result = []
    const innerIndex = cursor.innerIndex$
    for (let i = 0; i < innerIndex; i++)
      result.push(this.#denque.shift())
    this.__bumpVersion$()
    return result
  }
}

export class QueueCursor extends BidirectionalCursor {
  #queue
  #innerIndex

  constructor(queue, innerIndex) {
    super(queue)
    this.#queue = queue
    this.#initialize(innerIndex)
  }

  #initialize(innerIndex) {
    this.#innerIndex = innerIndex
  }

  recycle$(queue, innerIndex) {
    super.recycle$(queue)
    this.#initialize(innerIndex)
    return this
  }

  get queue$() { return this.#queue }
  get innerIndex$() { return this.#innerIndex }

  get isEnd() { 
    this.__checkVersion$()
    const { 
      queue$: queue, 
      innerIndex$: innerIndex 
    } = this
    return innerIndex === queue.count
  }
  get isBegin() { 
    this.__checkVersion$()
    const { 
      innerIndex$: innerIndex 
    } = this
    return innerIndex === 0 
  }
  get value() {
    this.__checkVersion$()
    if (this.isEnd) return null
    return this.#queue.get$(this.#innerIndex)
  }

  step() {
    this.__checkVersion$()
    if (this.isEnd) return false
    this.#innerIndex++
    return true
  }

  stepBack() {
    this.__checkVersion$()
    if (this.#innerIndex == 0) return false
    this.#innerIndex--
    return true
  }

  clone() {
    this.__checkVersion$()
    return new QueueCursor(this.#queue, this.#innerIndex)
  }

  equals(other) {
    this.__checkVersion$()
    const { 
      queue$: queue, 
      innerIndex$: index 
    } = this
    const { 
      queue$: otherQueue, 
      innerIndex$: otherIndex 
    } = other
    return index === otherIndex && queue === otherQueue
  }
}
