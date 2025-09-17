import { assert } from '@kingjs/assert'
import { extend } from '@kingjs/extend'
import { getParts } from '@kingjs/partial-class'
import { getConcepts } from '@kingjs/concept'

export function load(type) {
  assert(typeof type == 'function', 'type must be a function.')

  const extensions = [
    ...getConcepts(type),
    ...getParts(type)
  ]

  extend(type, ...extensions)
}
