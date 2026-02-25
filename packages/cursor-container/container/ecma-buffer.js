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
  partialContainerType$: PartialBufferContainer,
} = ContiguousCursor

export class EcmaBuffer extends PartialProxy {
  static cursorType = ContiguousCursor

  _buffer = null
  _view = null
  _count = 0

  constructor() {
    super()
    const bytes = new ArrayBuffer(8)
    this._buffer = new Uint8Array(bytes)
    this._view = new DataView(bytes)
  }

  // container
  dispose$() { this._buffer = null }

  static {
    extend(this, PartialBufferContainer)

    implement(this, RewindContainerConcept, {
      get count() { return this._count }
    })

    implement(this, IndexableContainerConcept, {
      at(index) { return this.view.getUint8(index) },
      setAt(index, value) { this.view.setUint8(index, value) }
    })

    implement(this, BufferContainerConcept, {
      get capacity() { return this.bytes.byteLength },
      setCapacity(capacity) {
        const newBytes = new ArrayBuffer(capacity)
        const newBuffer = new Uint8Array(newBytes)
        const newView = new DataView(newBytes)
        newBuffer.set(this.buffer)
        this._buffer = newBuffer
        this._view = newView
        return capacity
      },
      copy(cursor, begin, end) { 
        const { buffer: target } = cursor.range
        const { index: targetStart } = cursor
        const { index: sourceStart } = begin
        const { index: sourceEnd } = end
        const subArray = this.buffer.subarray(sourceStart, sourceEnd)
        target.set(subArray, targetStart)
      },
      data(begin = this.begin(), end = this.end()) { 
        return this.buffer.subarray(begin.index, end.index)
      },
      readAt(index, length = 1, signed = false, littleEndian = false) {
        const { view } = this

        switch (length) {
          case 1:
            return signed
              ? view.getInt8(index)
              : view.getUint8(index)

          case 2:
            return signed
              ? view.getInt16(index, littleEndian)
              : view.getUint16(index, littleEndian)

          case 4:
            return signed
              ? view.getInt32(index, littleEndian)
              : view.getUint32(index, littleEndian)

          default:
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
  get view() { return this._view }
  get bytes() { return this._buffer.buffer }
}