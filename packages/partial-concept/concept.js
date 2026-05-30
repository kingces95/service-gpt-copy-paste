import { assert } from '@kingjs/assert'
import { abstractify } from '@kingjs/abstract'
import { PartialType } from '@kingjs/partial-type'
import { Attachments } from '@kingjs/partial-attachments'
import {
  PartialMetadata,
  PartialReflect,
} from '@kingjs/partial-reflect'
import { 
  Adjacent,
  Defines, 
  Implements, 
  Compile,
  Precondition,
} from '@kingjs/partial-symbols'

export { Defines, Implements } from '@kingjs/partial-symbols'

// Associated partial types allow concepts to check concept-valued static
// metadata without needing an instance of the associated type.
function satisfiesAssociations(ctor, partialType) {
  for (const { value: associatedPartialType, key } of PartialMetadata.values(
    partialType, { extensionOf: PartialType, includeOverridden: true })) {

    const associatedType = ctor[key]
    if (!(typeof associatedType == 'function'))
      return false

    return PartialReflect.isComposedOf(associatedType, associatedPartialType)
  }
  return true
}

export class Concept extends PartialType {
  static [Adjacent] = {
    [Defines]: Attachments,
    [Implements]: Concept,
  }

  static [Compile](descriptor) {
    
    // pipeline
    descriptor = super[Compile](descriptor)
    descriptor = abstractify(descriptor)
    return descriptor
  }
  
  static [Symbol.hasInstance](instance) {
    // only happens if MyConcept.prototype passed as instance.
    if (instance instanceof PartialType) return false

    const ctor = instance?.constructor
    if (typeof ctor != 'function') return false
    
    const result = PartialReflect.isComposedOf(ctor, this)
    
    assert(!result || PartialReflect.canStrictDuckCast(this, instance),
      `Instance composed of but cannot be duck cast to ${this.name}`)

    return result 
  }

  static [Precondition](type) {
    const isPartialType = PartialType.isUserDefined(type)
    assert(isPartialType || satisfiesAssociations(type, this), 
      `Type ${type.name} does not satisfy associated concepts of ${this.name}`)
  }
}
