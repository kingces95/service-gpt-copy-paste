import { PartialType, Adjacent, Redeclare } from '@kingjs/partial-type'
import { Concept } from '@kingjs/partial-concept'
import { 
  Attachments, AbstractAttachments 
} from '@kingjs/partial-attachments'
import { 
  Defines, 
  Extends, 
  Implements, 
  Abstracts, 
  Precondition,
  Declarative,
  Procedural,
} from '@kingjs/partial-symbols'

export { 
  Extends, 
  Defines, 
  Implements, 
  Abstracts,
} from '@kingjs/partial-symbols'

export class PartialClass extends PartialType {
  static [Declarative] = Extends
  static [Procedural] = 'extend'
  static [Adjacent] = [
    Attachments,
    AbstractAttachments,
    PartialClass,
    Concept,
  ]
  static [Redeclare] = [ Concept ]
  static [Symbol.hasInstance] = Concept[Symbol.hasInstance]
  static [Precondition] = Concept[Precondition]
}
