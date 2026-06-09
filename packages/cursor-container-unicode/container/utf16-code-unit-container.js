import {
  Utf16ByteOrderMarks,
} from '@kingjs/unicode'
import {
  CodeUnitContainer,
} from './code-unit-container.js'

export class Utf16CodeUnitContainer extends CodeUnitContainer {
  constructor({ byteOrder = null } = { }) {
    super({
      byteOrder: byteOrder ?? Utf16ByteOrderMarks,
      byteWidth: 2,
    })
  }
}
