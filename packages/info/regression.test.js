import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Info, FunctionInfo } from "@kingjs/info"
import { Concept, Implements } from '@kingjs/concept'
import { PartialObject } from '@kingjs/partial-object'
import { PartialClass, Extends } from '@kingjs/partial-class'
import { PartialReflect } from '@kingjs/partial-reflect'
import { PartialPojo } from '@kingjs/partial-pojo'
import { } from "@kingjs/info-to-pojo"
import { toEqualAsSet } from '@kingjs/vitest'

// Ensure filtering of Es6 intrinsic members like 'constructor' and 'name' 
// from PartialClass info has been applied across all relevant members.
describe('PartialClass', () => {
  const info = Info.from(PartialClass)
  it('should not have an own constructor member', () => {
    const ctorMember = info.getOwnInstanceMember('constructor')
    expect(ctorMember).toBeNull()
  })
  it('should not have a constructor member', () => {
    const ctorMember = info.getInstanceMember('constructor')
    expect(ctorMember).toBeNull()
  })
  it('should not have an own name member', () => {
    const nameMember = info.getOwnStaticMember('name')
    expect(nameMember).toBeNull()
  })
  it('should not have a name member', () => {
    const nameMember = info.getStaticMember('name')
    expect(nameMember).toBeNull()
  })
})
