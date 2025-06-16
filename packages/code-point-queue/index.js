import { ChunkQueue as CodeUnitQueue } from "@kingjs/code-unit-queue"

export class CodePointQueue {
  #__version = 0
  #queue
  #isAligned
  #decodeValue
  #decodeString
  #begin
  #end

  constructor(isAligned, decodeValue, decodeString) {
    this.#queue = new CodeUnitQueue()
    this.#isAligned = isAligned
    this.#decodeValue = decodeValue
    this.#decodeString = decodeString
    this.#begin = new DecoderQueueCursor(this, this.#queue.begin())
    this.#end = new DecoderQueueCursor(this, this.#queue.end())
  }

  get __version$() { return this.#__version }

  isAligned$(cursor) { return this.#isAligned(cursor) }
  decodeValue$(buffer) { return this.#decodeValue(buffer) }

  get begin() { return this.#begin.clone() }
  get end() { return this.#end.clone() }

  push(chunk) {
    this.#queue.push(chunk)
    this.#__version++
  }

  read(cursor) {
    const result = this.#queue.pop(cursor.innerCursor$())
    this.#__version++
    return this.#decodeString(result)
  }

  ignore(cursor) {
    this.#queue.pop(cursor.innerCursor$())
    this.#__version++
  }
}

export class DecoderQueueCursor {
  #__version
  #queue
  #innerCursor

  constructor(queue, innerCursor) {
    this.#queue = queue
    this.#innerCursor = innerCursor
    this.#__version = queue.__version$
  }

  #__checkVersion() {
    if (this.#__version !== this.#queue.__version$()) throw new Error(
      'DecoderQueueCursor is invalid. The DecoderQueue was modified.')
  }

  innerCursor$() {
    this.#__checkVersion()
    return this.#innerCursor
  }

  step() {
    this.#__checkVersion()
    const cursor = this.#innerCursor
    const queue = this.#queue

    if (this.isEnd) return false

    while (!cursor.isEnd) {
      if (cursor.step() && queue.isAligned$(cursor))
        return true
    }

    this.stepBack()
    return false
  }

  stepBack() {
    this.#__checkVersion()
    const cursor = this.#innerCursor
    const queue = this.#queue

    if (this.isBegin) return false

    while (!cursor.isBegin) {
      if (cursor.stepBack() && queue.isAligned$(cursor))
        return true
    }

    this.step()
    return false
  }

  get isEnd() {
    this.#__checkVersion()
    return this.#innerCursor.isEnd
  }

  get isBegin() {
    this.#__checkVersion()
    return this.#innerCursor.isBegin
  }

  clone() {
    this.#__checkVersion()
    const innerCursor = this.#innerCursor
    const queue = this.#queue
    return new DecoderQueueCursor(queue, innerCursor.clone())
  }

  get value() {
    this.#__checkVersion()
    const innerCursor = this.#innerCursor
    return this.#queue.decodeValue$(innerCursor)
  }
}  
