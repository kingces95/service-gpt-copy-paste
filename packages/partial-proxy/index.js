import { assert } from '@kingjs/assert'
import { isAbstract } from '@kingjs/abstract'
import { getConditions } from '@kingjs/partial-metadata'
import { CreateThunk } from '@kingjs/partial-symbols'
import { Es6ThunkFactory } from '@kingjs/es6-thunk'
import { FunctionBuilder } from '@kingjs/function-builder'

export {
  CreateThunk,
  Preconditions,
  Postconditions,
  TypePrecondition,
  TypePostcondition,
} from '@kingjs/partial-symbols'

const thunkFactory = new Es6ThunkFactory((type, key) => {
  const conditions = getConditions(type, key)
  for (const key in conditions)
    conditions[key] = FunctionBuilder.require(conditions[key])
  return conditions
})

export class PartialProxy {
  static [CreateThunk](key, descriptor) {
    if (isAbstract(descriptor)) return descriptor
    return thunkFactory.create(this, key, descriptor)
  }
}
