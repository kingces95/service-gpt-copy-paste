import { ByteOrderedContainer } from './byte-ordered-container.js'

export class Utf32BECodeUnitContainer extends ByteOrderedContainer {
  constructor() {
    super({ byteOrder: 'big', byteWidth: 4 })
  }
}

export class Utf32LECodeUnitContainer extends ByteOrderedContainer {
  constructor() {
    super({ byteOrder: 'little', byteWidth: 4 })
  }
}
