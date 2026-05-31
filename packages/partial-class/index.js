import { PartialType, Adjacent, Redeclare } from '@kingjs/partial-type'
import { Concept } from '@kingjs/partial-concept'
import {
  Attachments, AbstractAttachments
} from '@kingjs/partial-attachments'
import {
  Defines,
  Composes,
  Implements,
  DefinesAbstract,
  Precondition,
  Declarative,
  Procedural,
} from '@kingjs/partial-symbols'

export {
  Composes,
  Defines,
  Implements,
  DefinesAbstract,
} from '@kingjs/partial-symbols'

export class PartialClass extends PartialType {
  static [Declarative] = Composes
  static [Procedural] = 'compose'
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
