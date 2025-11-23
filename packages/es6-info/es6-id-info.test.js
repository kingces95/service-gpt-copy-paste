import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Es6IdInfo } from './es6-id-info.js'

describe('Es6IdInfo', () => {
  let idInfo
  describe('with number id', () => {
    beforeEach(() => {
      idInfo = Es6IdInfo.create(42)
    })
    it('is not an anonymous id', () => {
      expect(idInfo.isAnnonymous).toBe(false)
    })
    it('is a number id', () => {
      expect(idInfo.isString).toBe(true)
      expect(idInfo.isSymbol).toBe(false)
    })
    it('has correct value', () => {
      expect(idInfo.value).toBe('42')
    })
    it('toString is the id as string', () => {
      expect(idInfo.toString()).toBe('42')
    })
    it('is non-public', () => {
      expect(idInfo.isNonPublic).toBe(false)
    })
  })
  describe('with string id', () => {
    beforeEach(() => {
      idInfo = Es6IdInfo.create('myId')
    })
    it('is not an anonymous id', () => {
      expect(idInfo.isAnnonymous).toBe(false)
    })
    it('is a string id', () => {
      expect(idInfo.isString).toBe(true)
      expect(idInfo.isSymbol).toBe(false)
    })
    it('has correct value', () => {
      expect(idInfo.value).toBe('myId')
    })
    it('toString is the id', () => {
      expect(idInfo.toString()).toBe('myId')
    })
    it('is non-public', () => {
      expect(idInfo.isNonPublic).toBe(false)
    })
  })
  describe('with non-public string id', () => {
    beforeEach(() => {
      idInfo = Es6IdInfo.create('_myId_')
    })
    it('is non-public', () => {
      expect(idInfo.isNonPublic).toBe(true)
    })
  })
  describe('with symbol id', () => {
    let sym = Symbol('mySym')
    beforeEach(() => {
      idInfo = Es6IdInfo.create(sym)
    })
    it('is not an anonymous id', () => {
      expect(idInfo.isAnnonymous).toBe(false)
    })
    it('is a symbol id', () => {
      expect(idInfo.isString).toBe(false)
      expect(idInfo.isSymbol).toBe(true)
    })
    it('has correct value', () => {
      expect(idInfo.value).toBe(sym)
    })
    it('toString is the symbol in brackets', () => {
      expect(idInfo.toString()).toBe(`[${sym.toString()}]`)
    })
    it('is non-public', () => {
      expect(idInfo.isNonPublic).toBe(false)
    })
  })
  describe('with null id', () => {
    beforeEach(() => {
      idInfo = Es6IdInfo.create(null)
    })
    it('is an anonymous id', () => {
      expect(idInfo.isAnnonymous).toBe(true)
      expect(idInfo.isString).toBe(false)
      expect(idInfo.isSymbol).toBe(false)
    })
    it('has no value', () => {
      expect(idInfo.value).toBe(null)
    })
    it('toString is <anonymous>', () => {
      expect(idInfo.toString()).toBe('<anonymous>')
    })
    it('is non-public', () => {
      expect(idInfo.isNonPublic).toBe(true)
    })
  })
})