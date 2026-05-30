import { 
  Implements, 
  Extends,
  Defines,
  Includes,
} from '@kingjs/partial-symbols'
import { create } from '@kingjs/partial-reflector'

export { isTransparent } from '@kingjs/partial-symbols'

export const {
  PartialReflect,
  PartialMetadata,
  PartialPreconditions,
  PartialPostconditions,
  PartialThisChecks,
  PartialArgChecks,
  PartialDefaults,
  PartialTransforms,
  getConditions,
  getMemberDefaults,
  getOwnMemberTransforms,
  copyTo,
} = create({
  knownStaticKeys: [
    Defines,      // from Attachments
    Extends,      // from PartialClass
    Implements,   // from Concept
    Includes,     // from Shape
  ]
})
