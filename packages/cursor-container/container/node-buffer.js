import { assert } from '@kingjs/assert'
import { implement } from '@kingjs/implement'
import { extend } from '@kingjs/partial-extend'
import { PartialProxy } from '@kingjs/partial-proxy'
import { ContiguousCursor } from '../cursor/contiguous-cursor.js'
import {
  RewindContainerConcept,
  IndexableContainerConcept,
  BufferContainerConcept,
} from '../container-concepts.js'

const {
  partialContainerType$: PartialContiguousContainer,
} = ContiguousCursor

export class NodeBuffer extends PartialProxy {
  static cursorType = ContiguousCursor

  _buffer = Buffer.alloc(8)
  _count = 0

  constructor() {
    super()
  }

  // container
  dispose$() { this._buffer = null }

  static {
    extend(this, PartialContiguousContainer)

    implement(this, RewindContainerConcept, {
      get count() { return this._count }
    })

    implement(this, IndexableContainerConcept, {
      at(index) { return this._buffer[index] },
      setAt(index, value) { this._buffer[index] = value }
    })

    implement(this, BufferContainerConcept, {
      get capacity() { return this._buffer.length },
      setCapacity(capacity) {
        const newBuffer = Buffer.alloc(capacity)
        this.buffer.copy(newBuffer)
        this._buffer = newBuffer
        return capacity
      },
      copy(cursor, begin, end) {    
        const { buffer: target } = cursor.range
        const { index: targetStart } = cursor
        const { index: sourceStart } = begin
        const { index: sourceEnd } = end
        this.buffer.copy(target, targetStart, sourceStart, sourceEnd)
      },
      data(begin = this.begin(), end = this.end()) { 
        return this.buffer.subarray(begin.index, end.index)
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