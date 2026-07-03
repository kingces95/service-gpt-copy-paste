import {
  Fields,
  Initializer,
  PartialClass,
  Self,
} from '@kingjs/partial-class'
import {
  RangeContainerPart,
} from '@kingjs/cursor-virtual'
import {
  byteSpansToStrings,
} from '../source-ranges-to-string.js'

export const Encoding = Symbol('StringMaterializationPart.Encoding')

export class StringMaterializationPart extends PartialClass {
  static [Self] = RangeContainerPart

  static [Fields] = {
    [Encoding]: null,
  }

  static [Initializer](encoding) {
    this[Encoding] = encoding
  }

  toStrings(encoding = this[Encoding]) {
    const rcp = this
    return byteSpansToStrings(rcp.spans(), encoding)
  }

  toString(encoding = null) {
    const strings = encoding == null
      ? this.toStrings()
      : this.toStrings(encoding)

    return [...strings].join('')
  }
}
