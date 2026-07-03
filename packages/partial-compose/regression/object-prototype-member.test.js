import { describe, expect, it } from 'vitest'
import { PartialClass } from '@kingjs/partial-class'
import { compose } from '@kingjs/partial-compose'

class StringPart extends PartialClass {
  toString() { return 'part' }
}

describe('object prototype members', () => {
  it('allows partial members to replace Object prototype members', () => {
    class Type {
      static {
        compose(this, StringPart)
      }
    }

    expect(new Type().toString()).toBe('part')
  })
})
