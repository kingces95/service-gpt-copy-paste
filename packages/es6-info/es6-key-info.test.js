import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Es6KeyInfo } from './es6-key-info.js'

describe('Es6KeyInfo', () => {
  let keyInfo

  describe('isNonPublic static method', () => {
    it('returns true for names starting with _', () => {
      expect(Es6KeyInfo.isNonPublic('_private')).toBe(true)
    })
    it('returns true for names ending with _', () => {
      expect(Es6KeyInfo.isNonPublic('private_')).toBe(true)
    })
    it('returns true for names starting with $', () => {
      expect(Es6KeyInfo.isNonPublic('$private')).toBe(true)
    })
    it('returns true for names ending with $', () => {
      expect(Es6KeyInfo.isNonPublic('private$')).toBe(true)
    })
    it('returns false for names without _ or $', () => {
      expect(Es6KeyInfo.isNonPublic('public')).toBe(false)
    })
    it('returns false for symbol names', () => {
      expect(Es6KeyInfo.isNonPublic(Symbol('sym'))).toBe(false)
    })
  })

  describe('with string key', () => {
    beforeEach(() => {
      keyInfo = Es6KeyInfo.create('myKey')
    })
    it('is public', () => {
      expect(keyInfo.isNonPublic).toBe(false)
    })
    it('equals itself', () => {
      expect(keyInfo.equals(keyInfo)).toBe(true)
    })
    it('equals another Es6KeyInfo with same key', () => {
      let other = Es6KeyInfo.create('myKey')
      expect(keyInfo.equals(other)).toBe(true)
    })
    it('does not equal another Es6KeyInfo with different key', () => {
      let other = Es6KeyInfo.create('otherKey')
      expect(keyInfo.equals(other)).toBe(false)
    })
    it('does not equal non-Es6KeyInfo', () => {
      expect(keyInfo.equals({})).toBe(false)
    })
    it('is a string key', () => {
      expect(keyInfo.isString).toBe(true)
      expect(keyInfo.isSymbol).toBe(false)
    })
    it('has correct value', () => {
      expect(keyInfo.value).toBe('myKey')
    })
    it('toString is the key', () => {
      expect(keyInfo.toString()).toBe('myKey')
    })
  })

  describe('with symbol key', () => {
    let sym = Symbol('mySym')
    beforeEach(() => {
      keyInfo = Es6KeyInfo.create(sym)
    })
    it('is a symbol key', () => {
      expect(keyInfo.isString).toBe(false)
      expect(keyInfo.isSymbol).toBe(true)
    })
    it('has correct value', () => {
      expect(keyInfo.value).toBe(sym)
    })
    it('toString is the symbol in brackets', () => {
      expect(keyInfo.toString()).toBe(`[${sym.toString()}]`)
    })
  })
})  