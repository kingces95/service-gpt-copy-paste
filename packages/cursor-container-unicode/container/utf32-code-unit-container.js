import {
  Utf32ByteOrderMarks,
} from '@kingjs/unicode'
import {
  CodeUnitContainer,
} from './code-unit-container.js'

export class Utf32CodeUnitContainer extends CodeUnitContainer {
  constructor({ byteOrder = null } = { }) {
    super({
      byteOrder: byteOrder ?? Utf32ByteOrderMarks,
      byteWidth: 4,
    })
  }
}
