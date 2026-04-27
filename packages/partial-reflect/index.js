import { 
  Implements, 
  Extends,
  Defines,
} from '@kingjs/partial-symbols'
import { create } from '@kingjs/partial-reflector'
// import { Attachments } from '@kingjs/partial-attachments'
// import { PartialClass } from '@kingjs/partial-class'
// import { Concept } from '@kingjs/partial-concept'
// import { Shape } from '@kingjs/partial-shape'

export { isTransparent } from '@kingjs/partial-symbols'

export const { PartialReflect, extend } = create({
  // knownTypes: [ 
  //   Attachments,
  //   PartialClass,
  //   Concept,
  //   Shape,
  // ],
  knownStaticKeys: [
    Defines,      // from Attachments
    Extends,      // from PartialClass
    Implements,   // from Concept
  ]
})
