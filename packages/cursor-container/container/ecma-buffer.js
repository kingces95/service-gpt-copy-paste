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

export class EcmaBuffer extends Container {
  static cursorType = ContiguousCursor

  _buffer = new DataView(new ArrayBuffer(8))
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
      at(index) { return this._buffer.getUint8(index) },
      setAt(index, value) { this.setUint8(index, value) }
    })

    implement(this, BufferContainerConcept, {
      get capacity() { return this._buffer.length },
      expand(capacity) {
        const newBuffer = Buffer.alloc(capacity)
        this.buffer.copy(newBuffer)
        this._buffer = newBuffer
        return capacity
      },
      readAt(index, length, signed, littleEndian) {
        const { buffer } = this

        switch (length) {
          case 1:
            return signed
              ? buffer.getInt8(index)
              : buffer.getUint8(index)

          case 2:
            return signed
              ? buffer.getInt16(index, littleEndian)
              : buffer.getUint16(index, littleEndian)

          case 4:
            return signed
              ? buffer.getInt32(index, littleEndian)
              : buffer.getUint32(index, littleEndian)
        }
      },
        data(index, cursor) { 
        const { buffer, byteOffset } = this.buffer
        const endIndex = cursor.index
        const length = endIndex - index
        return new DataView(buffer, byteOffset + index, length)
      },
    }, {
      insertRange(begin, end) { },
      removeRange(begin, end) { },
    })
  }

  get buffer() { return this._buffer }
}