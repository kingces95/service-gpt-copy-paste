import { assert } from '@kingjs/assert'
import { implement } from '@kingjs/implement'
import { ContiguousCursor } from '../cursor/contiguous-cursor.js'
import {BufferContainerConcept } from '../container-concepts.js'
import { EcmaBuffer } from './ecma-buffer.js'

export class NodeBuffer extends EcmaBuffer {
  static cursorType = ContiguousCursor

  _buffer
  _count

  constructor(buffer, count) {
    assert(!buffer || Buffer.isBuffer(buffer))
    assert(!count || count >= 0)
    assert(!buffer || !count || count <= buffer.length)
    if (!buffer) buffer = Buffer.alloc(8)
    if (!count) count = 0
    super(buffer, count)
    this._count = count
    this._buffer = buffer
  }

  static {

    implement(this, BufferContainerConcept, {
      writeAt(index, value, length = 1, signed = false, littleEndian = false) {
        const { buffer } = this

        switch (length) {
          case 1:
            return signed
              ? buffer.writeInt8(value, index) 
              : buffer.writeUInt8(value, index)
          case 2:
            return signed ? (littleEndian
              ? buffer.writeInt16LE(value, index) 
              : buffer.writeInt16BE(value, index)
            ) : (littleEndian 
              ? buffer.writeUInt16LE(value, index) 
              : buffer.writeUInt16BE(value, index)
            )
          case 4:
            return signed ? (littleEndian
              ? buffer.writeInt32LE(value, index) 
              : buffer.writeInt32BE(value, index)
            ) : (littleEndian 
              ? buffer.writeUInt32LE(value, index) 
              : buffer.writeUInt32BE(value, index)
            )
          default:
            throw new Error([
              `Unsupported length: ${length}.`,
              `Only 1, 2, or 4 bytes are supported.`,
              `Cannot write ${length} byte(s) at index ${index}.`
            ].join(' '))
        }
      },
      readAt(index, length = 1, signed = false, littleEndian = false) {
        const { buffer } = this

        switch (length) {
          case 1:
            return signed 
              ? buffer.readInt8(index) 
              : buffer.readUInt8(index)
          case 2:
            return signed ? (littleEndian 
              ? buffer.readInt16LE(index) 
              : buffer.readInt16BE(index)
            ) : (littleEndian 
              ? buffer.readUInt16LE(index) 
              : buffer.readUInt16BE(index)
            )
          case 4:
            return signed ? (littleEndian 
              ? buffer.readInt32LE(index) 
              : buffer.readInt32BE(index)
            ) : (littleEndian 
              ? buffer.readUInt32LE(index) 
              : buffer.readUInt32BE(index)
            )
          default:
            // todo: move to PreConditions
            throw new Error([
              `Unsupported length: ${length}.`,
              `Only 1, 2, or 4 bytes are supported.`,
              `Cannot read ${length} byte(s) at index ${index}.`
            ].join(' '))
        }
      },
    })
  }

  get buffer() { return this._buffer }
}