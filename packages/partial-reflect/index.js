import { 
  Implements, 
  Composes,
  Defines,
  Includes,
  Procedurals,
  Implementations,
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
    Composes,     // from PartialClass
    Implements,   // from Concept
    Includes,     // from Shape
    Procedurals,
    Implementations,
  ]
})
