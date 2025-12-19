import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { abstract } from '@kingjs/abstract'
import { extend } from '@kingjs/extend'
import { PartialClass, Extensions } from '@kingjs/partial-class'
import { PartialObject } from '@kingjs/partial-object'

describe('A type', () => {
  let type
  beforeEach(() => {
    type = class { }
  })
  it('can extend nothing', () => {
    expect(() => extend(type)).not.toThrow()
  })
  it('can extend null', () => {
    expect(() => extend(type, null)).toThrow()
  })
  it('throws extending a non-partial type', () => {
    expect(() => extend(type, class { })).toThrow()
  })
  describe('and a partial type as an object', () => {
    let partialType
    beforeEach(() => {
      partialType = { member: { value: () => 'member' } }
    })
    it('can extend the member', () => {
      extend(type, partialType)
      expect(type.prototype.member).toBe(partialType.member.value)
    })
  })
  describe('and a partial type with an abstract method', () => {
    let partialType
    beforeEach(() => {
      partialType = { method: { value: abstract } }
    })
    it('can extend the method', () => {
      // integration test
      extend(type, partialType)
      expect(type.prototype.method).toBe(abstract)
    })
  })
  describe('and a partial type with an abstract method', () => {
    let partialType
    beforeEach(() => {
      partialType = { method: abstract }
    })
    it('can extend the method', () => {
      // integration test
      extend(type, partialType)
      expect(type.prototype.method).toBe(abstract)
    })
  })
  describe('and a partial type with an abstract accessor', () => {
    let partialType
    beforeEach(() => {
      partialType = {
        accessor: {
          get: abstract,
          set: abstract,
        },
      }
    })
    it('can extend the accessor', () => {
      extend(type, partialType)
      const descriptor = Object.getOwnPropertyDescriptor(
        type.prototype, 'accessor')
      // an integration test
      expect(descriptor.get).toBe(abstract)
      expect(descriptor.set).toBe(abstract)
    })
  })
  describe('and a partial type with a member function', () => {
    let partialType
    beforeEach(() => {
      partialType = class extends PartialClass { 
        member() { return 'member' } }
    })
    it('can extend the member', () => {
      extend(type, partialType)
      expect(type.prototype.member).toBe(partialType.prototype.member)
    })
    describe('and another partial type with a member function', () => {
      let anotherPartialType
      beforeEach(() => {
        anotherPartialType = class extends PartialClass { 
          member() { return 'override' } }
      })
      it('can extend both partial types', () => {
        extend(type, partialType, anotherPartialType)
        expect(type.prototype.member).toBe(anotherPartialType.prototype.member)
      })
    })
    describe('as an extension', () => {
      let extendedPartialType
      beforeEach(() => {
        extendedPartialType = class extends PartialClass {
          static [Extensions] = partialType }
      })
      it('can extend the member', () => {
        extend(type, extendedPartialType)
        expect(type.prototype.member).toBe(partialType.prototype.member)
      })
      describe('that is an array of extensions', () => {
        beforeEach(() => {
          extendedPartialType[Extensions] = [partialType]
        })
        it('can extend the member', () => {
          extend(type, extendedPartialType)
          expect(type.prototype.member).toBe(partialType.prototype.member)
        })
      })
      describe('as an extension', () => {
        let extendedExtendedPartialType
        beforeEach(() => {
          extendedExtendedPartialType = class extends PartialClass {
            static [Extensions] = extendedPartialType }
        })
        it('can extend the member', () => {
          extend(type, extendedExtendedPartialType)
          expect(type.prototype.member).toBe(partialType.prototype.member)
        })
      })
    })
    describe('and a Compile function', () => {
      let didCompile
      let compiledMember = function() { return 'compiled' }
      beforeEach(() => {
        didCompile = false
        partialType[PartialObject.Compile] = function(descriptor) {
          expect(this).toBe(partialType)
          expect(descriptor.value).toBe(partialType.prototype.member)
          descriptor.value = compiledMember
          // remove metadata and check that defaults are false which
          // indicates Compile is a post compilation hook.
          delete descriptor.writable
          delete descriptor.enumerable
          delete descriptor.configurable
          didCompile = true
          return descriptor
        }
      })
      describe('when extended', () => {
        let compiledDescriptor
        beforeEach(() => {
          extend(type, partialType)
          compiledDescriptor = Object.getOwnPropertyDescriptor(
            type.prototype, 'member')
        })
        it('should have called the Compile function', () => {
          expect(didCompile).toBe(true)
        })
        it('should have defaults applied', () => {
          expect(compiledDescriptor.value).toBe(compiledMember)
          expect(compiledDescriptor.enumerable).toBe(false)
          expect(compiledDescriptor.writable).toBe(false)
          expect(compiledDescriptor.configurable).toBe(false)
        })
      })
    })
  })
})

