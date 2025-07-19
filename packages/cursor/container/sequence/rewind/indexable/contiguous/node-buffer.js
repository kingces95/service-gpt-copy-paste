import { ContiguousContainer } from "./contiguous-container.js"

export class NodeBuffer extends ContiguousContainer {
  __buffer

  constructor() {
    super()
    this.__buffer = Buffer.alloc(8)
  }
  
  // indexable cursor implementation
  at$$$(index) { return this.buffer$[index] }
  setAt$$$(index, value) { this.buffer$[index] = value }

  // cursor implementation
  readAt$$(index, offset, length, signed, littleEndian) {
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
  data$$(index, cursor) { 
    const buffer = this.buffer$
    const endIndex = cursor.index$
    return buffer.subarray(index, endIndex)
  }

  get buffer$() { return this.__buffer }
  get capacity$() { return this.__buffer.length }

  expand$(capacity) {
    const { buffer$: buffer } = this
    const newBuffer = Buffer.alloc(capacity)
    buffer.copy(newBuffer)
    this.__buffer = newBuffer
    return capacity
  }
  dispose$() { this.__buffer = null }
}