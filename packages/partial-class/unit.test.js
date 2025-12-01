import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { PartialClass } from '@kingjs/partial-class'
import { ExtensionGroup } from '@kingjs/extension-group'

describe('A method', () => {
  let method
  beforeEach(() => {
    method = function method() { }
  })
  describe('on an ExtensionGroup', () => {
    let extension
    beforeEach(() => {
      extension = class extends ExtensionGroup { }
      extension.prototype.method = method
    })
    describe('converted by PartialClass.fromArg', () => {
      let arg
      beforeEach(() => {
        arg = PartialClass.fromArg(extension)
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
    describe('converted by PartialClass.fromArg', () => {
      let arg
      beforeEach(() => {
        arg = PartialClass.fromArg(pojo)
      })
      it('should be a type that extends PartialClass', () => {
        expect(arg.prototype).toBeInstanceOf(PartialClass)
      })
      it('should have the method', () => {
        expect(arg.prototype.method).toBe(method)
      })
    })
    describe('converted by PartialClass.create', () => {
      let extension
      beforeEach(() => {
        extension = PartialClass.create(pojo)
      })
      it('should be a type that extends ExtensionGroup', () => {
        expect(extension.prototype).toBeInstanceOf(PartialClass)
      })
      it('should have the method', () => {
        expect(extension.prototype.method).toBe(method)
      })
    })
  })
})
