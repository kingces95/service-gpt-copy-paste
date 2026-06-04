import { assert } from '@kingjs/assert'
import { PartialReflect } from '@kingjs/partial-reflect'
import { Concept } from '@kingjs/partial-concept'
import { Attachments } from '@kingjs/partial-attachments'
import {
  applyDeclaration,
} from '@kingjs/partial-declare'

export function implement(
  type,
  concept,
  implementation = { },
  stillAbstract = { },
) {
  if (typeof type == 'function')
    assert(!PartialReflect.isExtensionOf(type, Concept),
      'Expected type to not extend Concept.')

  applyDeclaration.of(Concept, Attachments)(
    type, concept, implementation, stillAbstract)
}
