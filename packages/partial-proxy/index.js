import { assert } from '@kingjs/assert'
import { isAbstract } from '@kingjs/abstract'
import { getConditions } from '@kingjs/partial-reflect'
import { Thunk } from '@kingjs/partial-symbols'
import { createStub } from '@kingjs/es6-thunk'
import { FunctionBuilder } from '@kingjs/function-builder'

export {
  Thunk,
  Preconditions,
  Postconditions,
  TypePrecondition,
  TypePostcondition,
} from '@kingjs/partial-symbols'

export class PartialProxy {
  static [Thunk](key, descriptor) {
    if (isAbstract(descriptor)) return descriptor
    return createStub(this, key, descriptor, getUnifiedConditions)
  }
}

function getUnifiedConditions(type, key) {
  const conditions = getConditions(type, key)
  for (const key in conditions)
    conditions[key] = FunctionBuilder.require(conditions[key])
  return conditions
}