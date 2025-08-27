import { ContiguousContainer } from "./contiguous-container.js"

export class EcmaBuffer extends ContiguousContainer {
  #dataView 

  constructor() {
    super()

    this.#dataView = new DataView(new ArrayBuffer(8))
  }

  get dataView$() { return this.#dataView }
  get capacity$() { return this.dataView$.byteLength }
  expand$(capacity) {
    const { dataView$: dataView } = this
    const newBuffer = new ArrayBuffer(capacity)
    const newDataView = new DataView(newBuffer)
    new Uint8Array(newBuffer).set(new Uint8Array(dataView.buffer))
    this.#dataView = newDataView
  }

  // indexable cursor
  at$(index, offset) { return this.dataView$.getUint8(index + offset) }
  setAt$(index, offset, value) { this.dataView$.setUint8(index + offset, value) }

  // contiguous cursor
  readAt$(index, offset, length, signed, littleEndian) {
    const { dataView$: dataView } = this
    const indexOffset = index + offset

    switch (length) {
      case 1:
        return signed
          ? dataView.getInt8(indexOffset)
          : dataView.getUint8(indexOffset)

      case 2:
        return signed
          ? dataView.getInt16(indexOffset, littleEndian)
          : dataView.getUint16(indexOffset, littleEndian)

      case 4:
        return signed
          ? dataView.getInt32(indexOffset, littleEndian)
          : dataView.getUint32(indexOffset, littleEndian)
    }
  }
  data$(index, cursor) {
    const dataView = this.dataView$;
    const { buffer, byteOffset } = dataView;
    const endIndex = cursor.index$;
    const length = endIndex - index;

    return new DataView(buffer, byteOffset + index, length);
  }

  // container
  dispose$() { this.#dataView = null }
}
