import { abstractify } from '@kingjs/abstract'
import { PartialType } from '@kingjs/partial-type'
import { PartialReflect } from '@kingjs/partial-reflect'
import { Attachments } from '@kingjs/partial-attachments'
import { WeakMapLookup } from '@kingjs/weak-map-lookup'
import {
  Adjacent,
  Defines,
  Includes,
  Compile,
  Transparent,
} from '@kingjs/partial-symbols'

export { Defines, Includes } from '@kingjs/partial-symbols'

const matches = new WeakMapLookup()

function isMatch(shape, type) {
  const matchesOfShape = matches.of(shape)

  if (matchesOfShape.has(type))
    return matchesOfShape.get(type)

  const result = PartialReflect.canStrictDuckCast(shape, type.prototype)
  matchesOfShape.set(type, result)
  return result
}

export class Shape extends PartialType {
  static [Transparent] = true

  static [Adjacent] = {
    [Defines]: Attachments,
    [Includes]: Shape,
  }

  static [Compile](descriptor) {
    descriptor = super[Compile](descriptor)
    return abstractify(descriptor)
  }

  static [Symbol.hasInstance](instance) {
    if (this == Shape)
      return false

    if (instance == null)
      return false

    const type = instance.constructor

    if (typeof type != 'function')
      return false

    return isMatch(this, type)
  }
}
