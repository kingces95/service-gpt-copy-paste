import { ByteOrderedContainer } from './byte-ordered-container.js'

export class Utf16BECodeUnitContainer extends ByteOrderedContainer {
  constructor() {
    super({ byteOrder: 'big', byteWidth: 2 })
  }
}

export class Utf16LECodeUnitContainer extends ByteOrderedContainer {
  constructor() {
    super({ byteOrder: 'little', byteWidth: 2 })
  }
}
