import { PartialClass } from '@kingjs/partial-class'
import { Attachments } from '@kingjs/partial-attachments'
import { applyDeclaration } from '@kingjs/partial-declare'

// compose copies descriptors found on a partial type onto a target type.

// If the partial type composes other partial types, logically, those
// are merged in first. Members on the target type are not
// overwritten unless they are abstract (i.e. are implemented as
// @kingjs/abstract).

// All merged partial types are associated with the target type
// (PartialLoader.addPartialType).

// Transparent partial types are merged but not associated. A transparent
// partial type is one whose prototype extends Attachments. Members of
// a transparent partial type are logically considered to be defined by
// the partial type that composed it.

export function compose(
  type,
  partialClass,
  definitions,
  stillAbstract,
) {
  applyDeclaration.of(PartialClass, Attachments)(
    type, partialClass, definitions, stillAbstract)
}
