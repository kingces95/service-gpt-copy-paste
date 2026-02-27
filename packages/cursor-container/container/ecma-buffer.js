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

  _buffer
  _count
  _view

  constructor(buffer, count) {
    assert(!buffer || buffer instanceof Uint8Array)
    assert(!count || count >= 0)
    assert(!buffer || !count || count <= buffer.length)
    super()
    this._count = count || 0
    this._buffer = buffer || new Uint8Array(new ArrayBuffer(8))
    this._view = null
  }

  get bytes$() { return this._buffer.buffer }
  set view$(value) { this._view = value }
  get view$() {
    if (!this._view) this.view$ = new DataView(this.bytes$)
    return this._view
  }

  // container
  dispose$() { this._buffer = null }

  static {
    extend(this, PartialBufferContainer)

    implement(this, RewindContainerConcept, {
      get count() { return this._count }
    })

    implement(this, IndexableContainerConcept, {
      at(index) { return this.readAt(index) },
      setAt(index, value) { this.writeAt(index, value) }
    })

    implement(this, BufferContainerConcept, {
      get capacity() { return this.bytes$.byteLength },
      setCapacity(capacity) {
        const newBytes = new ArrayBuffer(capacity)
        const newBuffer = new Uint8Array(newBytes)
        newBuffer.set(this.buffer)
        this._buffer = newBuffer
        this._view = null
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
      writeAt(index, value, length = 1, signed = false, littleEndian = false) {
        const { view$: view } = this

        switch (length) {
          case 1:
            signed
              ? view.setInt8(index, value)
              : view.setUint8(index, value)
            break

          case 2:
            signed
              ? view.setInt16(index, value, littleEndian)
              : view.setUint16(index, value, littleEndian)
            break

          case 4:
            signed
              ? view.setInt32(index, value, littleEndian)
              : view.setUint32(index, value, littleEndian)
            break

          default:
            throw new Error([
              `Unsupported length: ${length}.`,
              `Only 1, 2, or 4 bytes are supported.`,
              `Cannot write ${length} byte(s) at index ${index}.`
            ].join(' '))
        }
      },
      readAt(index, length = 1, signed = false, littleEndian = false) {
        const { view$: view } = this

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
}