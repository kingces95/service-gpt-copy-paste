import { Queue } from "@kingjs/queue"

// A code unit is a sequence of bytes of a constant length that represents a 
// single character in a character encoding. The length of the code unit
// can be used as a modulus to determine the alignment of the cursor; If
// the remainder of the position of a byte in a stream divided by the code 
// unit length is zero, then the position is the beginning of a code unit.

// A sequence of bytes containing code units is typically delivered in 
// chunks the ending of which may not align with code unit boundaries.
// CodeUnitQueue abstracts away the chunking and allows the user to
// iterate over the code units as if they were delivered in a single chunk.

// Activation of the begin cursor is trivial, as it is always the first
// byte of the first chunk in the queue with a remainder of zero. 

// Activation of the end cursor is complicated becuase the position one 
// past the last byte in the last chunk may not align with the code unit 
// boundary. When the end cursor is activated, it will be passed a cursor
// to the last chunk in the queue, and the offset will be one past the 
// last aligned code unit boundary.
export class CodeUnitQueue {
  #__version = 0
  #byteCount = 0
  #unitLength
  #innerQueue
  #begin
  #end

  constructor(unitLength = 1) {
    const innerQueue = new Queue()
    this.#innerQueue = innerQueue
    this.#unitLength = unitLength
    this.#begin = new CodeUnitQueueCursor(this, innerQueue.begin(), 0)
    this.#end = new CodeUnitQueueCursor(this, innerQueue.end(), Infinity)
  }

  get __version$() { return this.#__version }
  get begin$() { return this.#begin }
  get end$() { return this.#end }
  get unitLength() { return this.#unitLength }

  begin() { return this.begin$.clone() }
  end() { return this.end$.clone() }

  push(chunk) {
    this.#innerQueue.push(chunk)
  }

  pop(cursor) {
    const innerQueue = this.#innerQueue
    const innerCursor = cursor.queueCursor$()

    const lastResult = innerCursor.value
    const result = [...innerQueue.pop(innerCursor), lastResult].filter(Boolean)
    if (!result.length)
      return []

    const first = 0
    const last = result.length - 1

    const endOffset = cursor.offset$()
    if (endOffset < Infinity) 
      result[last] = result[last].subarray(0, endOffset)

    const beginOffset = this.#begin.offset$()
    if (beginOffset > 0)
      result[first] = result[first].subarray(beginOffset)

    this.#begin = new CodeUnitQueueCursor(this, innerQueue.begin(), endOffset)
    this.#__version++
    return result
  }
}

export class CodeUnitQueueCursor {
  #__version
  #queue
  #innerCursor
  #innerOffset
  #offset

  constructor(queue, innerCursor, innerOffset = 0) {
    this.#queue = queue
    this.#innerCursor = innerCursor
    this.#innerOffset = innerOffset
    this.#offset = 0
    this.#__version = queue.__version
  }

  #__checkVersion() {
    if (this.#queue.__version !== this.#__version) throw new Error(
      "CodeUnitQueueCursor is invalid. CodeUnitQueue was modified.")
  }

  get #isAligned() {
    return this.#offset % this.#queue.unitLength === 0
  }

  #readUnit(bytes) {
    let value = 0
    for (let i = 0; i < bytes.length; i++) {
      value |= bytes[i] << (8 * (bytes.length - i - 1))
    }
    return value
  }

  offset$() { return this.#innerOffset }

  get isEnd() {
    this.#__checkVersion() 
    return this.#innerOffset == Infinity 
  }

  get isBegin() {
    this.#__checkVersion()
    const queue = this.#queue
    const innerCursor = this.#innerCursor
    const { offset: beginOffset } = queue.begin$
    return innerCursor.isBegin && this.#innerOffset == beginOffset
  }

  step() {
    this.#__checkVersion()
    const innerCursor = this.#innerCursor

    if (this.isEnd) return false

    while (!this.isEnd) {
      let innerOffset = this.#innerOffset + 1
      if (innerOffset == innerCursor.value.length) {
        if (!innerCursor.step()) break
        innerOffset = 0
      }
      this.#innerOffset = innerOffset
      this.#offset++
      if (this.#isAligned)
        return true
    }

    this.stepBack()
    return false
  }

  stepBack() {
    this.#__checkVersion()
    const innerCursor = this.#innerCursor

    if (this.isBegin) return false

    while (!this.isBegin) {
      let innerOffset = this.#innerOffset - 1
      if (innerOffset < 0) {
        if (!innerCursor.stepBack()) break
        innerOffset = innerCursor.value.length - 1
      }
      this.#innerOffset = innerOffset
      this.#offset--
      if (this.#isAligned)
        return true
    }

    this.step()
    return false
  }

  clone() {
    this.#__checkVersion()
    const innerCursor = this.#innerCursor
    const innerOffset = this.#innerOffset
    const queue = this.#queue
    return new CodeUnitQueueCursor(queue, innerCursor.clone(), innerOffset)
  }

  get value() {
    this.#__checkVersion()
    const unitLength = this.#queue.unitLength

    if (this.isEnd) return null

    if (unitLength === 1) {
      const chunk = this.#innerCursor.value
      return chunk[this.#innerOffset]
    }

    const result = new Uint8Array(unitLength)
    let remaining = unitLength
    let offset = this.#innerOffset
    let cursor = this.#innerCursor.clone()
    let i = 0

    while (remaining > 0) {
      const chunk = cursor.value
      const available = chunk.length - offset
      const take = Math.min(remaining, available)
      result.set(chunk.subarray(offset, offset + take), i)
      remaining -= take
      i += take

      if (remaining > 0) {
        if (!cursor.step())
          throw new Error("Not enough bytes to complete code unit")
        offset = 0
      }
    }

    return this.#readUnit(result)
  }

  queueCursor$() {
    return this.#innerCursor
  }
}  
