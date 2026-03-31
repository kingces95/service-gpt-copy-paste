import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Extensions } from '@kingjs/extensions'
import { PartialClass } from '@kingjs/partial-class'
import { PartialLoader } from '@kingjs/partial-loader'

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
    describe('converted by PartialLoader.load', () => {
      let arg
      beforeEach(() => {
        arg = PartialLoader.load(extension)
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
    describe('converted by PartialLoader.load', () => {
      let arg
      beforeEach(() => {
        arg = PartialLoader.load(pojo)
      })
      it('should be a type that extends Extensions', () => {
        expect(arg.prototype).toBeInstanceOf(Extensions)
      })
      it('should have the method', () => {
        expect(arg.prototype.method).toBe(method)
      })
    })
    describe('converted by PartialLoader.load', () => {
      let extension
      beforeEach(() => {
        extension = PartialLoader.load(pojo)
      })
      it('should be a type that extends PartialClass', () => {
        expect(extension.prototype).toBeInstanceOf(Extensions)
      })
      it('should have the method', () => {
        expect(extension.prototype.method).toBe(method)
      })
    })
  })
})
