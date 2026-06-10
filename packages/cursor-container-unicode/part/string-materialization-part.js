import {
  Defines,
  DefinesAbstract,
  PartialClass,
} from '@kingjs/partial-class'
import { members } from '@kingjs/partial-signature'

export class StringMaterializationPart extends PartialClass {
  static [DefinesAbstract] = members(this, {
    toStrings(encoding = null) { },
  })

  static [Defines] = {
    toString(encoding = null) {
      return [...this.toStrings(encoding)].join('')
    },
  }
}
