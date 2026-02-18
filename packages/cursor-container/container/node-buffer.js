import { implement } from '@kingjs/implement'
import { extend } from '@kingjs/partial-extend'
import { Container } from '../container.js'
import { ContiguousCursor } from '../cursor/contiguous-cursor.js'
import {
  RewindContainerConcept,
  IndexableContainerConcept,
  BufferContainerConcept,
} from '../container-concepts.js'

const {
  partialContainerType$: PartialBufferContainer,
} = ContiguousCursor

export class NodeBuffer extends Container {
  static cursorType = ContiguousCursor

  _buffer = Buffer.alloc(0)
  _count = 0

  constructor() {
    super()
  }

  // container
  dispose$() { this._buffer = null }

  static {
    extend(this, PartialBufferContainer)

    implement(this, RewindContainerConcept, {
      get count() { return this._count }
    })

    implement(this, IndexableContainerConcept, {
      at(index) { return this._buffer[index] },
      setAt(index, value) { this._buffer[index] = value }
    })

    implement(this, BufferContainerConcept, {
      get capacity() { return this._buffer.length },
      expand(capacity) {
        const newBuffer = Buffer.alloc(capacity)
        this.buffer.copy(newBuffer)
        this._buffer = newBuffer
        return capacity
      },
      readAt(index, offset, length, signed, littleEndian) {
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
      },
      data(index, cursor) { 
        const buffer = this.buffer
        const endIndex = cursor.index
        return buffer.subarray(index, endIndex)
      },
    }, {
      insertRange(begin, end) { },
      removeRange(begin, end) { },
    })
  }

  get buffer() { return this._buffer }
}