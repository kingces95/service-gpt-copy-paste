import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Attachments } from '@kingjs/partial-attachments'
import { From } from '@kingjs/partial-symbols'

describe('A method', () => {
  let method
  beforeEach(() => {
    method = function method() { }
  })
  describe('on a pojo', () => {
    let pojo
    beforeEach(() => {
      pojo = { method }
    })
    describe('defined as Attachments', () => {
      let arg
      beforeEach(() => {
        arg = Attachments[From](pojo)
      })
      it('should be a type that extends Attachments', () => {
        expect(arg.prototype).toBeInstanceOf(Attachments)
      })
      it('should have the method', () => {
        expect(arg.prototype.method).toBe(method)
      })
    })
  })
})
