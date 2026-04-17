import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Extensions } from '@kingjs/extensions'
import { Define } from '@kingjs/partial-symbols'

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
    describe('defined as Extensions', () => {
      let arg
      beforeEach(() => {
        arg = Extensions[Define](pojo)
      })
      it('should be a type that extends Extensions', () => {
        expect(arg.prototype).toBeInstanceOf(Extensions)
      })
      it('should have the method', () => {
        expect(arg.prototype.method).toBe(method)
      })
    })
  })
})
