import {
  initialize,
} from '@kingjs/partial-class'
import { compose } from '@kingjs/partial-compose'
import {
  ProjectedRangeContainer,
  VirtualContainer,
} from '@kingjs/cursor-virtual'
import {
  ByteOrderedPart,
} from '../part/byte-ordered-part.js'
import {
  StringMaterializationPart,
} from '../part/string-materialization-part.js'
import {
  byteOrderedEncodingOf,
} from '../source-ranges-to-string.js'
import {
  utfEncodingOfByteWidth,
} from '@kingjs/unicode'

class CodeUnitContainer extends ProjectedRangeContainer {
  constructor() {
    super(new VirtualContainer())
    const { byteOrder, byteWidth } = this.constructor
    const encoding = byteOrderedEncodingOf(
      utfEncodingOfByteWidth(byteWidth), byteOrder)

    initialize(this, ByteOrderedPart, byteOrder, byteWidth)
    initialize(this, StringMaterializationPart, encoding)
  }

  static {
    compose(this, ByteOrderedPart)
    compose(this, StringMaterializationPart)
  }
}

export class Utf16BECodeUnitContainer extends CodeUnitContainer {
  static byteOrder = 'big'
  static byteWidth = 2
}

export class Utf16LECodeUnitContainer extends CodeUnitContainer {
  static byteOrder = 'little'
  static byteWidth = 2
}

export class Utf32BECodeUnitContainer extends CodeUnitContainer {
  static byteOrder = 'big'
  static byteWidth = 4
}

export class Utf32LECodeUnitContainer extends CodeUnitContainer {
  static byteOrder = 'little'
  static byteWidth = 4
}
