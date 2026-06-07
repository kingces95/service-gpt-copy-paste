import { CodeUnitContainer } from './code-unit-container.js'

export class Utf32CodeUnitContainer extends CodeUnitContainer {
  constructor({ byteOrder }) {
    super({ byteOrder, byteWidth: 4 })
  }
}
