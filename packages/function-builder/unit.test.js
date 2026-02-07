import { describe, it, expect } from 'vitest'
import { FunctionBuilder } from './index.js'

describe('FunctionBuilder', () => {
  describe('require', () => {
    it('should return null if no functions are given', () => {
      expect(FunctionBuilder.require()).toBeNull()
    })
    it('should return the function if only one is given', () => {
      const fn = function() { }
      expect(FunctionBuilder.require([fn])).toBe(fn)
    })
    it('should return a function that calls all given functions', () => {
      const calls = []
      const fn1 = function() { calls.push('fn1') }
      const fn2 = function() { calls.push('fn2') }
      const fn3 = function() { calls.push('fn3') }
      const combined = FunctionBuilder.require([fn1, fn2, fn3])
      combined()
      expect(calls).toEqual(['fn1', 'fn2', 'fn3'])
    })
  })
})