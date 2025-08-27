import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { 
  DescriptorEx,
  defineProperties,
  parseAndCompile, 
  abstract,
} from "@kingjs/abstract"
import { Info } from "@kingjs/info"
import { filterInfoPojo } from "@kingjs/info-to-pojo"

describe('abstract', () => {
  it('throws an error', () => {
    expect(() => abstract()).toThrowError('Abstract member not implemented')
  })
})

describe('Abstract descriptor', () => {
  it('should return false for null', () => {
    expect(DescriptorEx.isAbstract(null)).toBe(false)
  })
  it('should return false if a function is defined', () => {
    expect(DescriptorEx.isAbstract(() => { value: () => { } })).toBe(false)
  })
  it('should be returned by compiling null', () => {
    const descriptor = DescriptorEx.compile(null)
    expect(DescriptorEx.isAbstract(descriptor)).toBe(true)
  })
  describe.each([
    ['getter', { isGetter: true }, { get: null }],
    ['setter', { isSetter: true }, { set: null }],
    ['accessor', { isAccessor: true }, { get: null, set: null }],
    ['data', { isData: true }, { value: null }],
  ])('of type %s', (_, info, descriptor) => {
    describe('compiled', () => {
      let descriptor$
      beforeEach(() => {
        const compiled = parseAndCompile({ member: descriptor })
        descriptor$ = compiled.member
      })
      it('should be abstract', () => {
        expect(DescriptorEx.isAbstract(descriptor$)).toBe(true)
      })
    })
    describe('defined', () => {
      let descriptor$
      beforeEach(() => {
        const prototype = {}
        defineProperties(prototype, { member: descriptor })
        descriptor$ = Object.getOwnPropertyDescriptor(prototype, 'member')
      })
      it('should be abstract', () => {
        expect(DescriptorEx.isAbstract(descriptor$)).toBe(true)
      })
    })
  })
})

describe('A kitchen sink concise definition', () => {
  let conciseDefinition
  beforeEach(() => {
    let get, set, value
    conciseDefinition = {
      getter: { get },
      setter: { set: null },
      accessor: { get, set: abstract },

      member0: { value },
      member1: abstract,
    }
  })

  describe('defined on a class', () => {
    let cls
    beforeEach(() => {
      [cls] = [class { }]
      defineProperties(cls.prototype, conciseDefinition)
    })

    it('should have and info pojo', async () => {
      const pojo = filterInfoPojo(await Info.from(cls).__toPojo())
      expect(pojo).toEqual({
        __members: {
          getter: { hasGetter: true, isAbstract: true },
          setter: { hasSetter: true, isAbstract: true },
          accessor: { hasGetter: true, hasSetter: true, isAbstract: true },

          member0: { isMethod: true, isAbstract: true },
          member1: { isMethod: true, isAbstract: true },
        },
        base: 'Object',
      })
    })
  })
})