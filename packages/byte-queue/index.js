import { Queue } from "@kingjs/queue"
import { AbstractQueue, BidirectionalCursor } from "@kingjs/cursor"

export class ByteQueue extends AbstractQueue {
  #innerQueue
  #beginOffset
  #count

  constructor() {
    super()
    this.#innerQueue = new Queue()
    this.#beginOffset = 0
    this.#count = 0
  }

  get beginOffset$() { return this.#beginOffset }

  get count() { return this.#count }

  begin() {
    const innerQueue = this.#innerQueue
    const innerCursor = innerQueue.begin()
    const beginOffset = this.#beginOffset
    return new ByteQueueCursor(this, innerCursor, beginOffset)
  }
  end() {
    const innerQueue = this.#innerQueue
    const innerCursor = innerQueue.end()
    const endOffset = 0
    return new ByteQueueCursor(this, innerCursor, endOffset)
  }

  push(value) { 
    if (!(value instanceof Buffer))
      throw new Error("Value must be a Buffer.")
    if (value.length == 0) return

    this.#innerQueue.push(value)
    this.#count += value.length
  }
  pop(cursor = this.end()) {
    const innerQueue = this.#innerQueue
    const innerCursor = cursor.innerCursor$

    const lastChunk = innerCursor.value
    const leadingChunks = innerQueue.pop(innerCursor)
    const firstChunk = leadingChunks[0]
    const chunks = [...leadingChunks, lastChunk].filter(Boolean)

    const endOffset = cursor.offset$
    if (endOffset < lastChunk?.length) 
      chunks[chunks.length - 1] = lastChunk.subarray(0, endOffset)

    const beginOffset = this.#beginOffset
    if (beginOffset > 0)
      chunks[0] = firstChunk.subarray(beginOffset)

    this.#beginOffset = endOffset
    this.#count -= chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    this.__bumpVersion$()
    return chunks
  }
}

export class ByteQueueCursor extends BidirectionalCursor {
  #queue
  #offset
  #innerCursor

  constructor(queue, innerCursor, offset = 0) {
    super(queue)
    this.#queue = queue
    this.#innerCursor = innerCursor
    this.#offset = offset
  }

  get queue$ () { return this.#queue }
  get offset$() { return this.#offset }
  get innerCursor$() { return this.#innerCursor }

  get isEnd() { 
    this.__checkVersion$()
    const { innerCursor$: innerCursor } = this
    return innerCursor.isEnd
  }
  get isBegin() { 
    this.__checkVersion$()
    const { 
      queue$: queue, 
      innerCursor$: innerCursor, 
      offset$: offset 
    } = this

    const beginOffset = queue.beginOffset$
    return innerCursor.isBegin && offset == beginOffset
  }
  get value() {
    this.__checkVersion$()
    if (this.isEnd) return null

    const { 
      innerCursor$: innerCursor, 
      offset$: offset 
    } = this
    const chunk = innerCursor.value
    return chunk[offset]
  }

  step() {
    this.__checkVersion$()
    const { innerCursor$: innerCursor } = this

    if (this.isEnd) return false
    
    const chunk = innerCursor.value
    let offset = this.#offset + 1
    if (offset == chunk.length) {
      innerCursor.step()
      offset = 0
      return true
    }
    
    this.#offset = offset
    return true
  }

  stepBack() {
    this.__checkVersion$()
    const { innerCursor$: innerCursor } = this

    if (this.isBegin) return false

    let offset = this.#offset
    if (offset == 0) {
      innerCursor.stepBack()
      const chunk = innerCursor.value
      offset = chunk.length
    }
    
    this.#offset = offset - 1
    return true
  }

  clone() {
    this.__checkVersion$()
    const { 
      queue$: queue, 
      innerCursor$: innerCursor, 
      offset$: offset 
    } = this
    return new ByteQueueCursor(queue, innerCursor.clone(), offset)
  }

  equals(other) {
    this.__checkVersion$()
    const { 
      queue$: otherQueue, 
      innerCursor$: otherInnerCursor, 
      offset$: otherOffset 
    } = other

    const { 
      queue$: queue, 
      innerCursor$: innerCursor, 
      offset$: offset 
    } = this

    return queue === otherQueue 
      && innerCursor.equals(otherInnerCursor) 
      && offset === otherOffset
  }
}
