import { PartialType, Declarations } from '@kingjs/partial-type'
import { Attachments } from '../partial-attachments'
import { Defines, Extends } from '@kingjs/partial-symbols'
export { Extends, Defines } from '@kingjs/partial-symbols'

export class PartialClass extends PartialType {
  static [Declarations] = {
    [Extends]: PartialClass,
    [Defines]: Attachments,
  }
}
