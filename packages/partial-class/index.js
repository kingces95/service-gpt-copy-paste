import { PartialType, Adjacent } from '@kingjs/partial-type'
import { Concept } from '@kingjs/partial-concept'
import { 
  Attachments, AbstractAttachments 
} from '@kingjs/partial-attachments'
import { 
  Defines, 
  Extends, 
  Implements, 
  Abstracts, 
  DependsOn,
  Precondition,
} from '@kingjs/partial-symbols'

export { 
  Extends, 
  Defines, 
  Implements, 
  Abstracts,
  DependsOn,
} from '@kingjs/partial-symbols'

export class PartialClass extends PartialType {
  static [Adjacent] = {
    [Defines]: Attachments,
    [Abstracts]: AbstractAttachments,
    [Extends]: PartialClass,
    [Implements]: Concept,
  }
  static [Symbol.hasInstance] = Concept[Symbol.hasInstance]
  static [Precondition] = Concept[Precondition]
}
