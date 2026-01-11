import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { es6Typeof } from '@kingjs/es6-typeof'

describe('es6Typeof', () => {
  it('should return number for numbers', () => {
    expect(es6Typeof(1)).toBe('number')
  })
  it('should return string for strings', () => {
    expect(es6Typeof('a')).toBe('string')
  })
  it('should return boolean for booleans', () => {
    expect(es6Typeof(true)).toBe('boolean')
  })
  it('should return symbol for symbols', () => {
    expect(es6Typeof(Symbol())).toBe('symbol')
  })  
  it('should return bigint for bigints', () => {
    expect(es6Typeof(1n)).toBe('bigint')
  })
  it('should return undefined for undefined', () => {
    expect(es6Typeof(undefined)).toBe('undefined')
  })
  it('should return null for null', () => {
    expect(es6Typeof(null)).toBe('null')
  })
  it('should return array for arrays', () => {
    expect(es6Typeof([])).toBe('array')
  })
  it('should return function for functions', () => {
    expect(es6Typeof(function() {})).toBe('function')
  })
  it('should return class for classes', () => {
    expect(es6Typeof(class {})).toBe('class')
  })
  it('should return object for objects', () => {
    expect(es6Typeof({})).toBe('object')
  })
})