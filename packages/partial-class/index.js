import { PartialType, Declarations } from '@kingjs/partial-type'
import { Attachments } from '../partial-attachments'
import { Concept } from '@kingjs/partial-concept'
import { Defines, Extends, Implements } from '@kingjs/partial-symbols'

export { Extends, Defines, Implements } from '@kingjs/partial-symbols'

export class PartialClass extends PartialType {
  static [Declarations] = {
    [Defines]: Attachments,
    [Extends]: PartialClass,
    [Implements]: Concept,
  }
}
