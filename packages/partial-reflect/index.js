import { 
  Implements, 
  Extends,
  Defines,
} from '@kingjs/partial-symbols'
import { create } from '@kingjs/partial-reflector'

export { isTransparent } from '@kingjs/partial-symbols'

const MetaKeys = [
  Defines,      // from Attachments
  Extends,      // from PartialClass
  Implements,   // from Concept
]

export const { PartialReflect, extend } = create({
  knownStaticKeys: MetaKeys,
})
