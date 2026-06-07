import { assert } from '@kingjs/assert'
import { define } from '@kingjs/partial-define'
import { Uint32 } from '@kingjs/simple-type'
import { CodeUnitContainer } from './code-unit-container.js'

export class Utf32CodeUnitContainer extends CodeUnitContainer {
  static {
    define(this, {
      decodeToken$(sourceCursor) {
        const value = sourceCursor.value
        assert(value instanceof Uint32,
          'Expected UTF-32 source value to be Uint32.')
        return value
      },
    })
  }
}
