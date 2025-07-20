import { ContiguousContainer } from "./contiguous-container.js"

export class NodeBuffer extends ContiguousContainer {
  #buffer

  constructor() {
    super()
    this.#buffer = Buffer.alloc(8)
  }

  get buffer$() { return this.#buffer }
  get capacity$() { return this.#buffer.length }
  expand$(capacity) {
    const { buffer$: buffer } = this
    const newBuffer = Buffer.alloc(capacity)
    buffer.copy(newBuffer)
    this.#buffer = newBuffer
    return capacity
  }

  // indexable cursor
  at$(index, offset) { return this.buffer$[index + offset] }
  setAt$(index, offset, value) { this.buffer$[index + offset] = value }

  // contiguous cursor
  readAt$(index, offset, length, signed, littleEndian) {
    const { buffer$: buffer } = this
    const indexOffset = index + offset

    switch (length) {
      case 1:
        return signed 
          ? buffer.readInt8(indexOffset) 
          : buffer.readUInt8(indexOffset)
      case 2:
        return signed ? (littleEndian 
          ? buffer.readInt16LE(indexOffset) 
          : buffer.readInt16BE(indexOffset)
        ) : (littleEndian 
          ? buffer.readUInt16LE(indexOffset) 
          : buffer.readUInt16BE(indexOffset)
        )
      case 4:
        return signed ? (littleEndian 
          ? buffer.readInt32LE(indexOffset) 
          : buffer.readInt32BE(indexOffset)
        ) : (littleEndian 
          ? buffer.readUInt32LE(indexOffset) 
          : buffer.readUInt32BE(indexOffset)
        )
    }
  }

  // cursor factory
  data$(index, cursor) { 
    const buffer = this.buffer$
    const endIndex = cursor.index$
    return buffer.subarray(index, endIndex)
  }
  
  // container
  dispose$() { this.#buffer = null }
}