import { assert } from '@kingjs/assert'
import { declareField, declareType } from '@kingjs/es6-define'
import { Attachments } from '@kingjs/partial-attachments'
import { PartialType, Adjacent } from '@kingjs/partial-type'
import {
  Defines,
  Implementation,
} from '@kingjs/partial-symbols'

export class PartialImplementation extends PartialType {
  static [Implementation] = true
  static [Adjacent] = Attachments

  static create(host, declaration, implementation) {
    assert(typeof host == 'function',
      'Argument host must be a type.')
    assert(PartialType.isUserDefined(declaration),
      'Argument declaration must be a user defined PartialType.')
    assert(PartialType.getFamily(implementation) == Attachments,
      'Argument implementation must extend Attachments.')

    const result = declareType(
      `${host.name}Implements${declaration.name}`,
      PartialImplementation)

    return declareField(result, Defines, implementation)
  }
}
