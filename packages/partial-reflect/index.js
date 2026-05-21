import { 
  Implements, 
  Extends,
  Defines,
  DependsOn,
  Includes,
} from '@kingjs/partial-symbols'
import { create } from '@kingjs/partial-reflector'

export { isTransparent } from '@kingjs/partial-symbols'

export const { PartialReflect, copyTo } = create({
  knownStaticKeys: [
    Defines,      // from Attachments
    Extends,      // from PartialClass
    Implements,   // from Concept
    DependsOn,    // from PartialReflect
    Includes,     // from Shape
  ]
})
