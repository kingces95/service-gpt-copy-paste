import { describe, it, expect } from 'vitest'
import { PartialType } from '@kingjs/partial-type'

describe('PartialType', () => {
  it('should not be user defined', () => {
    expect(PartialType.isUserDefined(PartialType)).toBe(false)
  })
  it('should not have a family', () => {
    expect(PartialType.getFamily(PartialType)).toBe(null)
  })
})

describe('A PartialType family', () => {
  class MyPartialType extends PartialType { }
  class MyExtension extends MyPartialType { }
  class MyDerivedExtension extends MyExtension { }

  it('should not consider the family root user defined', () => {
    expect(PartialType.isUserDefined(MyPartialType)).toBe(false)
  })
  it('should not give the family root a family', () => {
    expect(PartialType.getFamily(MyPartialType)).toBe(null)
  })
  it('should consider extensions user defined', () => {
    expect(PartialType.isUserDefined(MyExtension)).toBe(true)
    expect(PartialType.isUserDefined(MyDerivedExtension)).toBe(true)
  })
  it('should report the direct PartialType extension as the family', () => {
    expect(PartialType.getFamily(MyExtension)).toBe(MyPartialType)
    expect(PartialType.getFamily(MyDerivedExtension)).toBe(MyPartialType)
  })
  it('should report user defined extensions in the same family', () => {
    expect(PartialType.isSameFamily(MyExtension, MyDerivedExtension)).toBe(true)
    expect(PartialType.isSameFamily(MyDerivedExtension, MyExtension)).toBe(true)
  })
  it('should not report family roots in the same family', () => {
    expect(PartialType.isSameFamily(MyPartialType, MyExtension)).toBe(false)
    expect(PartialType.isSameFamily(MyExtension, MyPartialType)).toBe(false)
  })
  it('should not report non-partial types in the same family', () => {
    expect(PartialType.isSameFamily(MyExtension, class { })).toBe(false)
  })
})
