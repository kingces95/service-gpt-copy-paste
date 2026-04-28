import { 
  Implements, 
  Extends,
  Defines,
} from '@kingjs/partial-symbols'
import { create } from '@kingjs/partial-reflector'

export { isTransparent } from '@kingjs/partial-symbols'

export const { PartialReflect, extend } = create({
  knownStaticKeys: [
    Defines,      // from Attachments
    Extends,      // from PartialClass
    Implements,   // from Concept
  ]
})
