import { assert } from '@kingjs/assert'
import { asMetadata } from '@kingjs/as-metadata'

export function createSelfCheck(part, requirements) {
  requirements = asMetadata(requirements)
  const checked = new Set()

  for (const requirement of requirements)
    assert(typeof requirement == 'function',
      'PartialClass self requirement must be a function.')

  return function checkSelf() {
    const Type = this.constructor
    if (checked.has(Type))
      return

    for (const requirement of requirements)
      assert(this instanceof requirement,
        `${part.name} requires ${requirement.name}.`)

    checked.add(Type)
  }
}
