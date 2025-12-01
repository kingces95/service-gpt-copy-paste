import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Info, FunctionInfo } from "@kingjs/info"
import { Extensions } from '@kingjs/extension-group'
import { extend } from '@kingjs/extend'
import { PartialClass } from '@kingjs/partial-class'

function getMemberValue(cls) {
  const info = Info.from(cls)
  const member = FunctionInfo.getMember(info, 'member')
  const value = member?.value
  return value
}

describe('A class with a member', () => {
  let cls
  beforeEach(() => {
    [cls] = [class { member() { } }]
  })
  describe('and a partial class with a member', () => {
    let partial
    let memberFn = function member() { }
    beforeEach(() => {
      partial = PartialClass.create({ member: memberFn })
    })
    it('should match class and partial member', async () => {
      extend(cls, partial)
      const partialMember = getMemberValue(partial)
      const clsMember = getMemberValue(cls)
      expect(clsMember).toBe(memberFn)
      expect(partialMember).toBe(memberFn)
    })
    describe('with extensions with a member', () => {
      let extension
      let extensionMember = function member() { }
      beforeEach(() => {
        extension = { member: extensionMember }
        partial[Extensions] = extension
      })
      it('should match class and extensions member', async () => {
        // check runtime behavior
        extend(cls, partial)
        const clsMember = getMemberValue(cls)
        expect(clsMember).toBe(extensionMember)
        
        // check reflection behavior
        const partialMember = getMemberValue(partial)
        expect(partialMember).not.toBe(memberFn)
        expect(partialMember).toBe(extensionMember)
      })
      it('should have partial names as a subset of class names', async () => {
        const partialNames = [
          ...FunctionInfo.names(Info.from(partial), { isStatic: false })]
        const clsNames = [
          ...FunctionInfo.names(Info.from(cls), { isStatic: false })]
        for (const name of partialNames)
          expect(clsNames).toContain(name)
      })
    })
  })
})
