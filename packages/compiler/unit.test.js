import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Compiler } from '@kingjs/compiler'

const {
  compile,
  parse,
  emit,
} = Compiler

function getterFn() { }
function setterFn() { }
function fn() { }
class MyClass { }

describe('A descriptor', () => {
  it('should emit null for null', () => {
    const descriptor = emit(null)
    expect(descriptor).toBeNull()
  })
  it('should parse null for null', () => {
    const descriptor = parse(null)
    expect(descriptor).toBeNull()
  })

  let descriptor
  beforeEach(() => {
    descriptor = { }
  })

  describe('method', () => {
    beforeEach(() => {
      descriptor.value = fn
    })
    describe('with explict non-defaults', () => {
      beforeEach(() => {
        descriptor.enumerable = true
        descriptor.configurable = false
        descriptor.writable = false
      })
      describe('parsed', () => {
        let result
        beforeEach(() => {
          result = parse(descriptor)
        })
        it('should have been copied', () => {
          expect(result).not.toBe(descriptor)
          expect(result.value).toBe(fn)
        })
        it('should have no metadata', () => {
          expect(result.enumerable).toBeUndefined()
          expect(result.configurable).toBeUndefined()
          expect(result.writable).toBeUndefined()
        })
      })
      describe('emitted', () => {
        let result
        beforeEach(() => {
          result = emit(descriptor)
        })
        it('should have been copied', () => {
          expect(result).not.toBe(descriptor)
          expect(result.value).toBe(fn)
        })
        it('should match the enumerable setting', () => {
          expect(result.enumerable).toBe(true)
        })
        it('should match the configurable setting', () => {
          expect(result.configurable).toBe(false)
        })
        it('should match the writable setting', () => {
          expect(result.writable).toBe(false)
        })
      })
    })
    describe('parsed', () => {
      let result
      beforeEach(() => {
        result = parse(descriptor)
      })
      it('should have been copied', () => {
        expect(result).not.toBe(descriptor)
        expect(result.value).toBe(fn)
      })
      it('should have no metadata', () => {
        expect(result.enumerable).toBeUndefined()
        expect(result.configurable).toBeUndefined()
        expect(result.writable).toBeUndefined()
      })
    })
    describe('emitted', () => {
      let result
      beforeEach(() => {
        result = emit(descriptor)
      })
      it('should have been copied', () => {
        expect(result).not.toBe(descriptor)
        expect(result.value).toBe(fn)
      })
      it('should be configurable', () => {
        expect(result.configurable).toBe(true)
      })
      it('should be non-enumerable', () => {
        expect(result.enumerable).toBe(false)
      })
      it('should be writable', () => {
        expect(result.writable).toBe(true)
      })
    })
    describe
  })
  describe('accessor', () => {
    beforeEach(() => {
      descriptor.get = getterFn
      descriptor.set = setterFn
    })
    describe('parsed', () => {
      let result
      beforeEach(() => {
        result = parse(descriptor)
      })
      it('should have been copied', () => {
        expect(result).not.toBe(descriptor)
        expect(result.get).toBe(getterFn)
        expect(result.set).toBe(setterFn)
      })
      it('should have no metadata', () => {
        expect(result.enumerable).toBeUndefined()
        expect(result.configurable).toBeUndefined()
        expect(result.writable).toBeUndefined()
      })
    })
    describe('emitted', () => {
      let result
      beforeEach(() => {
        result = emit(descriptor)
      })
      it('should have been copied', () => {
        expect(result).not.toBe(descriptor)
        expect(result.get).toBe(getterFn)
        expect(result.set).toBe(setterFn)
      })
      it('should be configurable', () => {
        expect(result.configurable).toBe(true)
      })
      it('should be non-enumerable', () => {
        expect(result.enumerable).toBe(false)
      })
      it('should have no default write setting', () => {
        expect(result.writable).toBeUndefined()
      })
    })
    describe('compiled', () => {
      let result
      beforeEach(() => {
        result = compile(descriptor)
      })
      it('should have been parsed and emitted', () => {
        let expected = parse(descriptor)
        expected = emit(expected)
        expect(result).toEqual(expected)
      })
    })
  })
  describe.each([
    ['number', 42],
    ['type', MyClass],
  ])('%s data', (_, data) => {
    beforeEach(() => {
      descriptor.value = data
    })
    describe('parsed', () => {
      let result
      beforeEach(() => {
        result = parse(descriptor)
      })
      it('should have been copied', () => {
        expect(result).not.toBe(descriptor)
        expect(result.value).toBe(data)
      })
      it('should have no metadata', () => {
        expect(result.enumerable).toBeUndefined()
        expect(result.configurable).toBeUndefined()
        expect(result.writable).toBeUndefined()
      })
    })
    describe('compiled', () => {
      let result
      beforeEach(() => {
        result = compile(descriptor)
      })
      it('should have been parsed and emitted', () => {
        let expected = parse(descriptor)
        expected = emit(expected)
        expect(result).toEqual(expected)
      })
    })
    describe('indirected', () => {
      let indirectDescriptor
      beforeEach(() => {
        indirectDescriptor = { value: descriptor }
      })
      describe('parsed', () => {
        let result
        beforeEach(() => {
          result = parse(indirectDescriptor)
        })
        it('should have been copied', () => {
          expect(result).not.toBe(indirectDescriptor)
          expect(result.value).toBe(data)
        })
        it('should have no metadata', () => {
          expect(result.enumerable).toBeUndefined()
          expect(result.configurable).toBeUndefined()
          expect(result.writable).toBeUndefined()
        })
      })
      describe('compiled', () => {
        let result
        beforeEach(() => {
          result = compile(indirectDescriptor)
        })
        it('should have been parsed and emitted', () => {
          let expected = parse(indirectDescriptor)
          expected = emit(expected)
          expect(result).toEqual(expected)
        })
      })
    })
    describe('emitted', () => {
      let result
      beforeEach(() => {
        result = emit(descriptor)
      })
      it('should have been copied', () => {
        expect(result).not.toBe(descriptor)
        expect(result.value).toBe(data)
      })
      it('should be configurable', () => {
        expect(result.configurable).toBe(true)
      })
      it('should be enumerable', () => {
        expect(result.enumerable).toBe(true)
      })
      it('should be writable', () => {
        expect(result.writable).toBe(true)
      })
    })
  })
})
