import { assert } from '@kingjs/assert'
import { define } from '@kingjs/partial-define'
import { Uint16 } from '@kingjs/simple-type'
import { CodeUnitContainer } from './code-unit-container.js'

export class Utf16CodeUnitContainer extends CodeUnitContainer {
  static {
    define(this, {
      decodeToken$(sourceCursor) {
        const value = sourceCursor.value
        assert(value instanceof Uint16,
          'Expected UTF-16 source value to be Uint16.')
        return value
      },
    })
  }
}
