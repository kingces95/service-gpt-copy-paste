import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Reflection } from "@kingjs/reflection"

describe('Extended and base classes', () => {
  describe.each([
    ['names', true],
    ['symbols', false],
  ])('with %s', (_, isNames) => {
    describe.each([
      '|',
      'a|',
      'a,b|',
      'a|a',
      '|a',
      '|a,b',
      'a,b|a,b',
    ])('%s', (declarations) => {
      let extended
      let base
      let members
      let names
      let symbols
    
      beforeEach(() => {
        base = class { }
        extended = class extends base { }
        const [extendedMembers$, baseMembers$] = declarations.split('|')
        const extendedMembers = extendedMembers$.split(',').filter(Boolean)
        const baseMembers = baseMembers$.split(',').filter(Boolean)

        if (!isNames) {
          extendedMembers.forEach((name, i) => extendedMembers[i] = Symbol.for(name))
          baseMembers.forEach((name, i) => baseMembers[i] = Symbol.for(name))
        }
    
        extendedMembers.unshift('constructor')
        extendedMembers.reduce((prototype, name) => {
          prototype[name] = null
          return prototype
        }, extended.prototype)
    
        baseMembers.unshift('constructor')
        baseMembers.reduce((prototype, name) => {
          prototype[name] = null
          return prototype
        }, base.prototype)
    
        // members is a unique union of extended and base members as an array
        members = [...new Set([...extendedMembers, ...baseMembers])].filter(Boolean)
        names = members.filter(name => typeof name === 'string')
        symbols = members.filter(name => typeof name === 'symbol')
      })
    
      it('has all members in its prototype', () => {
        expect([...Reflection.namesAndSymbols(extended.prototype)]).toEqual(members)
      })
      it('has all names', () => {
        expect([...Reflection.names(extended.prototype)]).toEqual(names)
      })
      it('has all symbols', () => {
        expect([...Reflection.symbols(extended.prototype)]).toEqual(symbols)
      })
    })
  })
})
