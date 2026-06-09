import { DefinesAbstract } from '@kingjs/partial-class'
import { PartialClass } from '@kingjs/partial-class'

export class CloneEmptyPart extends PartialClass {
  static [DefinesAbstract] = {
    cloneEmpty() { },
  }
}
