import { isAbstract } from '@kingjs/abstract'
import {
  getConditions,
  getMemberDefaults,
} from '@kingjs/partial-reflect'
import { mapKeys } from '@kingjs/map-keys'
import { trimPojo } from '@kingjs/pojo-trim'
import { CreateThunk } from '@kingjs/partial-symbols'
import { Es6ThunkFactory } from '@kingjs/es6-thunk'
import { FunctionBuilder } from '@kingjs/function-builder'

export {
  CreateThunk,
  TypeChecks,
  ThisChecks,
  ArgChecks,
  Defaults,
  Transforms,
  Preconditions,
  Postconditions,
  TypePrecondition,
  TypePostcondition,
} from '@kingjs/partial-symbols'

const thunkFactory = new Es6ThunkFactory((type, key) => {
  return trimPojo({
    conditions: mapKeys(getConditions(type, key), FunctionBuilder.require),
    defaults: getMemberDefaults(type, key),
  }, {
    sparseArray: true,
  })
})

export class PartialProxy {
  static [CreateThunk](key, descriptor) {
    if (isAbstract(descriptor)) return descriptor
    return thunkFactory.create(this, key, descriptor)
  }
}
