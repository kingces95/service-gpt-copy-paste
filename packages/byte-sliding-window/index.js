import { ObjectSlidingWindow } from "@kingjs/object-sliding-window"
import { SlidingWindow, BidirectionalCursor } from "@kingjs/cursor"

export class ByteSlidingWindow extends SlidingWindow {
  static get Cursor() { return ByteSlidingWindowCursor }

  #innerWindow
  #firstChunkOffset

  constructor() {
    super()
    this.#innerWindow = new ObjectSlidingWindow()
    this.#firstChunkOffset = 0
  }

  get firstChunkOffset$() { return this.#firstChunkOffset }

  begin(recyclable) {
    super.begin(recyclable)
    const innerWindow = this.#innerWindow
    const innerCursor = innerWindow.begin()
    const beginOffset = this.#firstChunkOffset
    return this.cursor$(recyclable, innerCursor, beginOffset)
  }
  end(recyclable) {
    super.end(recyclable)
    const innerWindow = this.#innerWindow
    const innerCursor = innerWindow.end()
    const endOffset = 0
    return this.cursor$(recyclable, innerCursor, endOffset)
  }

  push(chunk) { 
    super.push(chunk)
    if (!(chunk instanceof Buffer))
      throw new Error("Chunk must be a Buffer.")
    if (chunk.length == 0) return

    this.#innerWindow.push(chunk)
  }
  shift(cursor = this.end()) {
    super.shift(cursor)
    const innerQueue = this.#innerWindow
    const innerCursor = cursor.innerCursor$

    const lastChunk = innerCursor.value
    const lastChunkOffset = cursor.offset$

    const leadingChunks = innerQueue.shift(innerCursor)
    const result = [...leadingChunks, lastChunk].filter(Boolean)

    if (lastChunk && lastChunkOffset < lastChunk.length) 
      result[result.length - 1] = lastChunk.subarray(0, lastChunkOffset)
    
    const firstChunk = result[0]
    const firstChunkOffset = this.#firstChunkOffset
    if (firstChunk && firstChunkOffset > 0)
      result[0] = firstChunk.subarray(firstChunkOffset)

    // normalize the result
    if (result.at(-1)?.length == 0) result.pop()

    this.#firstChunkOffset = lastChunkOffset
    super.shift(cursor)
    return result
  }

  dispose() {
    const result = this.shift()
    super.dispose()
    this.#innerWindow.dispose()
    this.#innerWindow = null
    this.#firstChunkOffset = 0
    return result
  }
}

export class ByteSlidingWindowCursor extends BidirectionalCursor {
  #window
  #offset
  #innerCursor

  constructor(window, innerCursor, offset = 0) {
    super(window)
    this.#window = window
    this.#initialize(innerCursor, offset)
  }

  #initialize(innerCursor, offset) {
    this.#innerCursor = innerCursor
    this.#offset = offset
  }

  recycle$(window, innerCursor, offset = 0) {
    super.recycle$(window)
    this.#initialize(innerCursor, offset)
    return this
  }

  get window$ () { return this.#window }
  get offset$() { return this.#offset }
  get innerCursor$() { return this.#innerCursor }

  get isEnd() { 
    this.__throwIfStale$()
    const { 
      innerCursor$: innerCursor 
    } = this

    return innerCursor.isEnd
  }
  get isBegin() { 
    this.__throwIfStale$()
    const { 
      window$: window, 
      innerCursor$: innerCursor, 
      offset$: offset 
    } = this

    const firstChunkOffset = window.firstChunkOffset$
    return innerCursor.isBegin && offset == firstChunkOffset
  }
  get value() { return this.readUInt8() }

  readUInt8() { return this.read() }
  readInt8() { return this.read(signed = true) }

  readUInt16BE() { return this.read(length = 2) }
  readInt16BE() { return this.read(length = 2, signed = true) }
  readUInt16LE() { return this.read(length = 2, bigEndian = false) }
  readInt16LE() { return this.read(length = 2, signed = true, bigEndian = false) }

  readUInt32BE() { return this.read(length = 4) }
  readInt32BE() { return this.read(length = 4, signed = true) }
  readUInt32LE() { return this.read(length = 4, bigEndian = false) }
  readInt32LE() { return this.read(length = 4, signed = true, bigEndian = false) }

  read(length = 1, signed = false, littleEndian = false) {
    this.__throwIfStale$()
    if (length != 1 && length != 2 && length != 4) throw new Error(
      `Unsupported length: ${length}. Only 1, 2, or 4 bytes are supported.`)

    if (this.isEnd) return null

    const innerCursor = this.innerCursor$
    let offset = this.offset$
    let chunk = innerCursor.value

    // Hard case: Primitive cross chunk boundary
    if (offset + length > chunk.length) {

      // Copy bytes from accross chunks into one buffer.
      const buffer = Buffer.alloc(length)
      let current = innerCursor.clone()
      for (let i = 0; i < length; i++) {
        buffer.writeUInt8(current.value, i)
        if (!current.step()) return null // Not enough bytes to read.
      }

      offset = 0
      chunk = buffer
    }

    // Common case: Read bytes from the current chunk.
    switch (length) {
      case 1:
        return signed ? chunk.readInt8(offset) : chunk.readUInt8(offset)
      case 2:
        return signed 
          ? (littleEndian ? chunk.readInt16LE(offset) : chunk.readInt16BE(offset))
          : (littleEndian ? chunk.readUInt16LE(offset) : chunk.readUInt16BE(offset))
      case 4:
        return signed
          ? (littleEndian ? chunk.readInt32LE(offset) : chunk.readInt32BE(offset))
          : (littleEndian ? chunk.readUInt32LE(offset) : chunk.readUInt32BE(offset))
    }
  }

  step() {
    this.__throwIfStale$()
    if (this.isEnd) return false
    
    const { innerCursor$: innerCursor } = this
    const chunk = innerCursor.value
    let offset = this.#offset + 1
    if (offset == chunk.length) {
      innerCursor.step()
      offset = 0
    }
    
    this.#offset = offset
    return true
  }

  stepBack() {
    this.__throwIfStale$()
    if (this.isBegin) return false
    
    const { innerCursor$: innerCursor } = this
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
    this.__throwIfStale$()
    const { 
      window$: window, 
      innerCursor$: innerCursor, 
      offset$: offset 
    } = this
    return new ByteSlidingWindowCursor(window, innerCursor.clone(), offset)
  }

  equals(other) {
    this.__throwIfStale$()
    const { 
      window$: otherWindow, 
      innerCursor$: otherInnerCursor, 
      offset$: otherOffset 
    } = other
    const { 
      window$: window, 
      innerCursor$: innerCursor, 
      offset$: offset 
    } = this

    if (window != otherWindow) return false
    if (!innerCursor.equals(otherInnerCursor)) return false
    if (offset != otherOffset) return false
    return true
  }
}
