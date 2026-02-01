import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { PartialPojo } from '@kingjs/partial-pojo'
import { PartialClass } from '@kingjs/partial-class'
import { PartialReflect } from '@kingjs/partial-reflect'

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
    describe('converted by PartialReflect.load', () => {
      let arg
      beforeEach(() => {
        arg = PartialReflect.load(extension)
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
    describe('converted by PartialReflect.load', () => {
      let arg
      beforeEach(() => {
        arg = PartialReflect.load(pojo)
      })
      it('should be a type that extends PartialPojo', () => {
        expect(arg.prototype).toBeInstanceOf(PartialPojo)
      })
      it('should have the method', () => {
        expect(arg.prototype.method).toBe(method)
      })
    })
    describe('converted by PartialReflect.load', () => {
      let extension
      beforeEach(() => {
        extension = PartialReflect.load(pojo)
      })
      it('should be a type that extends PartialClass', () => {
        expect(extension.prototype).toBeInstanceOf(PartialPojo)
      })
      it('should have the method', () => {
        expect(extension.prototype.method).toBe(method)
      })
    })
  })
})
