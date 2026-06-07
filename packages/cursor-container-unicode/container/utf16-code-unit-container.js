import { CodeUnitContainer } from './code-unit-container.js'

export class Utf16CodeUnitContainer extends CodeUnitContainer {
  constructor({ byteOrder }) {
    super({ byteOrder, byteWidth: 2 })
  }
}
