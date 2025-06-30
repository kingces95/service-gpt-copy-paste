import { SequenceCursor } from '../sequence-container.js'

export class ContiguousCursor extends SequenceCursor {
  constructor(sequence, index) {
    super(sequence, index)
  }

  get buffer$() { return this.container$.data }

  get isContiguous() { return true }

  clone() {
    this.__throwIfStale$()
    const { container$: container, index$: index } = this
    return new ContiguousCursor(container, index)
  }

  get value() {
    this.__throwIfStale$()
    const { buffer$: buffer, index$: index, } = this
    return buffer[index]
  }

  readUInt8() { return this.read() }
  readInt8() { return this.read(1, true) }

  readUInt16BE() { return this.read(2) }
  readInt16BE() { return this.read(2, true) }
  readUInt16LE() { return this.read(2, false, true) }
  readInt16LE() { return this.read(2, true, true) }

  readUInt32BE() { return this.read(4) }
  readInt32BE() { return this.read(4, true) }
  readUInt32LE() { return this.read(4, false, true) }
  readInt32LE() { return this.read(4, true, true) }

  read(length = 1, signed = false, littleEndian = false) {
    this.__throwIfStale$()
    const { buffer$: buffer, index$: index } = this
    if (index + length > buffer.length) throw new RangeError(
      `Index out of bounds: ${index} + ${length} > ${buffer.length}`)

    switch (length) {
      case 1:
        return signed ? 
          chunk.readInt8(index) : chunk.readUInt8(index)
      case 2:
        return signed 
          ? (littleEndian ? 
            chunk.readInt16LE(index) : chunk.readInt16BE(index))
          : (littleEndian ? 
            chunk.readUInt16LE(index) : chunk.readUInt16BE(index))
      case 4:
        return signed
          ? (littleEndian ? 
            chunk.readInt32LE(index) : chunk.readInt32BE(index))
          : (littleEndian ? 
            chunk.readUInt32LE(index) : chunk.readUInt32BE(index))
      default:
        throw new Error(
          `Unsupported length: ${length}. Only 1, 2, or 4 bytes are supported.`)
    }    
  }
}