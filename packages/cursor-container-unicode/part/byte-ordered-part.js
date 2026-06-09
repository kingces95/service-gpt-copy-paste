import {
  DefinesAbstract,
  PartialClass,
} from '@kingjs/partial-class'

export class ByteOrderedPart extends PartialClass {
  static [DefinesAbstract] = {
    get byteOrder() { },
  }
}
