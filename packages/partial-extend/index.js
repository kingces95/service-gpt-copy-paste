import { assert } from '@kingjs/assert'
import { PartialReflect, copyTo } from '@kingjs/partial-reflect'
import { Attachments } from '@kingjs/partial-attachments'
import { From } from '@kingjs/partial-symbols'
import { PartialClass } from '@kingjs/partial-class'

// Extend takes copies (merges) descriptors found on a partial type
// on to a targets type.

// If the partial type extends other partial types, logically, those 
// are merged in first. Members on the target type are not 
// overwritten unless they are abstract (i.e. are implemented as 
// @kingjs/abstract).

// All merged partial types are associated with the target type 
// (PartialLoader.addPartialType).

// Transparent partial types are merged but not associated. A transparent
// partial type is one whose prototype extends Attachments. Members of
// a transparent partial type are logically considered to be defined by 
// the partial type that "extended" it. 

export function extend(type, partialClass, definitions) {
  assert(PartialReflect.isExtensionOf(partialClass, PartialClass),
    'Argument partialClass must extend PartialClass.')
  copyTo(partialClass, type)

  if (definitions) {
    const attachments = Attachments[From](definitions)
    assert(PartialReflect.isExtensionOf(attachments, Attachments),
      'Argument definition must extend Attachments.')
    copyTo(attachments, type)
  }
}