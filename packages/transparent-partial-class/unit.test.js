import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { TransparentPartialClass } from '@kingjs/transparent-partial-class'
import { PartialClass } from '@kingjs/extension-group'

describe('A method', () => {
  let method
  beforeEach(() => {
    method = function method() { }
  })
  describe('on an PartialClass', () => {
    let extension
    beforeEach(() => {
      extension = class extends PartialClass { }
      extension.prototype.method = method
    })
    describe('converted by TransparentPartialClass.fromArg', () => {
      let arg
      beforeEach(() => {
        arg = TransparentPartialClass.fromArg(extension)
      })
      it('should be the extension class', () => {
        expect(arg).toBe(extension)
      })
    })
  })
  describe('on a pojo', () => {
    let pojo
    beforeEach(() => {
      pojo = { method }
    })
    describe('converted by TransparentPartialClass.fromArg', () => {
      let arg
      beforeEach(() => {
        arg = TransparentPartialClass.fromArg(pojo)
      })
      it('should be a type that extends TransparentPartialClass', () => {
        expect(arg.prototype).toBeInstanceOf(TransparentPartialClass)
      })
      it('should have the method', () => {
        expect(arg.prototype.method).toBe(method)
      })
    })
    describe('converted by TransparentPartialClass.create', () => {
      let extension
      beforeEach(() => {
        extension = TransparentPartialClass.create(pojo)
      })
      it('should be a type that extends PartialClass', () => {
        expect(extension.prototype).toBeInstanceOf(TransparentPartialClass)
      })
      it('should have the method', () => {
        expect(extension.prototype.method).toBe(method)
      })
    })
  })
})
