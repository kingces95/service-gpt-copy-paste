import { describe, it, expect } from 'vitest'
import { Defines, PartialClass } from '@kingjs/partial-class'
import { compose } from '@kingjs/partial-compose'
import { members } from '@kingjs/partial-signature'
import { thunk } from '@kingjs/function-contract'

class SignaturePart extends PartialClass {
  static [Defines] = {
    ...members(this, {
      declared: {
        method() { },
      },
    }),

    runtime: thunk({
      method() { },
    }),
  }
}

class SignatureType {
  static {
    compose(this, SignaturePart)
  }
}

describe('Signature named members', () => {
  it('are renamed to their member key when composed', () => {
    expect(SignatureType.prototype.declared.name).toBe('declared')
    expect(SignatureType.prototype.runtime.name).toBe('runtime')
  })
})
