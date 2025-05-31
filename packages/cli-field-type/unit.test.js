import { CliFieldType } from './index.js'
import { describe, it, expect, beforeEach } from 'vitest'
import { toBeEquals, toBeEmptyString } from '@kingjs/vitest'

expect.extend({ toBeEquals, toBeEmptyString })

describe('Record type', () => {
  describe('for word', () => {
    let type
    beforeEach(() => { type = CliFieldType.word })

    it('should be loadable by "word"', () => {
      expect(CliFieldType.getType('word')).toBe(type)
    })
    it('should be loadable by "?"', () => {
      expect(CliFieldType.getType('?')).toBe(type)
    })
    it('should be literal', () => {
      expect(type.isLiteral).toBe(true)
    })
    it('should have isWord true', () => {
      expect(type.isWord).toBe(true)
      expect(type.isNumber).toBe(false)
      expect(type.isBoolean).toBe(false)
      expect(type.isComment).toBe(false)
      expect(type.isEnum).toBe(false)
      expect(type.isAny).toBe(false)
    })
    it('should have name "word"', () => {
      expect(type.name).toBe('word')
    })
    it('should have alias "?"', () => {
      expect(type.alias).toBe('?')
    })
    it('should parse empty string to empty string', () => {
      expect(type.parse('')).toBe('')
    })
    it('should parse null to empty string', () => {
      expect(type.parse(null)).toBe('')
    })
    it('should parse undefined to undefined', () => {
      expect(type.parse(undefined)).toBe('')
    })
    it('should have no enum values', () => {
      expect([...type.values()]).toEqual([])
    })
    it('should report not having "a"', () => {
      expect(type.has('a')).toBe(false)
    })
  })
  describe('for number', () => {
    let type
    beforeEach(() => { type = CliFieldType.number })

    it('should be loadable by "number"', () => {
      expect(CliFieldType.getType('number')).toBe(type)
    })
    it('should be loadable by "#"', () => {
      expect(CliFieldType.getType('#')).toBe(type)
    })
    it('should be literal', () => {
      expect(type.isLiteral).toBe(true)
    })
    it('should have isNumber true', () => {
      expect(type.isNumber).toBe(true)
      expect(type.isWord).toBe(false)
      expect(type.isBoolean).toBe(false)
      expect(type.isComment).toBe(false)
      expect(type.isEnum).toBe(false)
      expect(type.isAny).toBe(false)
    })
    it('should have name "number"', () => {
      expect(type.name).toBe('number')
    })
    it('should have alias "#"', () => {
      expect(type.alias).toBe('#')
    })
    it('should parse empty string to NaN', () => {
      expect(type.parse('')).toBeNaN()
    })
    it('should parse null to NaN', () => {
      expect(type.parse(null)).toBeNaN()
    })
    it('should parse undefined to NaN', () => {
      expect(type.parse(undefined)).toBeNaN()
    })
    it('should parse "0" to 0', () => {
      expect(type.parse('0')).toBe(0)
    })
  })
  describe('for boolean', () => {
    let type
    beforeEach(() => { type = CliFieldType.boolean })

    it('should be loadable by "boolean"', () => {
      expect(CliFieldType.getType('boolean')).toBe(type)
    })
    it('should be loadable by "!"', () => {
      expect(CliFieldType.getType('!')).toBe(type)
    })
    it('should be literal', () => {
      expect(type.isLiteral).toBe(true)
    })
    it('should have isBoolean true', () => {
      expect(type.isBoolean).toBe(true)
      expect(type.isWord).toBe(false)
      expect(type.isNumber).toBe(false)
      expect(type.isComment).toBe(false)
      expect(type.isEnum).toBe(false)
      expect(type.isAny).toBe(false)
    })
    it('should have name "boolean"', () => {
      expect(type.name).toBe('boolean')
    })
    it('should have alias "!"', () => {
      expect(type.alias).toBe('!')
    })
    it('should parse empty string to false', () => {
      expect(type.parse('')).toBe(false)
    })
    it('should parse null to false', () => {
      expect(type.parse(null)).toBe(false)
    })
    it('should parse undefined to false', () => {
      expect(type.parse(undefined)).toBe(false)
    })
    it('should parse "0" to false', () => {
      expect(type.parse('0')).toBe(false)
    })
    it('should parse "false" to false', () => {
      expect(type.parse('false')).toBe(false)
    })
    it('should parse "False" to false', () => {
      expect(type.parse('False')).toBe(false)
    })
    it('should parse "1" to true', () => {
      expect(type.parse('1')).toBe(true)
    })
  })
  describe('for comment', () => {
    let type
    beforeEach(() => { type = CliFieldType.comment })

    it('should be loadable by "comment"', () => {
      expect(CliFieldType.getType('comment')).toBe(type)
    })
    it('should be loadable by "*"', () => {
      expect(CliFieldType.getType('*')).toBe(type)
    })
    it('should not be literal', () => {
      expect(type.isLiteral).toBe(false)
    })
    it('should have isComment true', () => {
      expect(type.isComment).toBe(true)
      expect(type.isWord).toBe(false)
      expect(type.isNumber).toBe(false)
      expect(type.isBoolean).toBe(false)
      expect(type.isEnum).toBe(false)
      expect(type.isAny).toBe(false)
    })
    it('should have name "comment"', () => {
      expect(type.name).toBe('comment')
    })
    it('should have alias "*"', () => {
      expect(type.alias).toBe('*')
    })
    it('should parse empty string to empty string', () => {
      expect(type.parse('')).toBe('')
    })
    it('should parse null to empty string', () => {
      expect(type.parse(null)).toBe('')
    })
  })
  describe('for enum', () => {
    describe('specified as { a: null, b: null }', () => {
      let type
      beforeEach(() => { type = CliFieldType.getType({ a: null, b: null }) })
  
      it('should have values "a" and "b"', () => {
        expect([...type.values()]).toEqual(["a", "b"])
      })
      it('should report having "a"', () => {
        expect(type.has('a')).toBe(true)
      })
      it('should report not having "b"', () => {
        expect(type.has('c')).toBe(false)
      })
      it('should be a literal', () => {
        expect(type.isLiteral).toBe(true)
      })
      it('should have name "enum"', () => {
        expect(type.name).toBe('enum')
      })
      it('should have no alias', () => {
        expect(type.alias).toBeNull()
      })
      it('should have isEnum true', () => {
        expect(type.isEnum).toBe(true)
        expect(type.isWord).toBe(false)
        expect(type.isNumber).toBe(false)
        expect(type.isBoolean).toBe(false)
        expect(type.isComment).toBe(false)
        expect(type.isAny).toBe(false)
      })
      it('should parse empty string to empty string', () => {
        expect(type.parse('')).toBe('')
      })
    })
  })
  describe('for unknown type', () => {
    it('should throw when getting type for "unknown"', () => {
      expect(() => CliFieldType.getType('unknown'))
        .toThrow("Unknown field type 'unknown'")
    })
  })
  describe('for any', () => {
    let type
    beforeEach(() => { type = CliFieldType.any })

    it('should be loadable by "any"', () => {
      expect(CliFieldType.getType('any')).toBe(type)
    })
    it('should not be literal', () => {
      expect(type.isLiteral).toBe(false)
    })
    it('should have isAny true', () => {
      expect(type.isComment).toBe(false)
      expect(type.isWord).toBe(false)
      expect(type.isNumber).toBe(false)
      expect(type.isBoolean).toBe(false)
      expect(type.isEnum).toBe(false)
      expect(type.isAny).toBe(true)
    })
    it('should have name "any"', () => {
      expect(type.name).toBe('any')
    })
    it('should have no alias', () => {
      expect(type.alias).toBeNull()
    })
    it('should throw on parse', () => {
      expect(() => type.parse(''))
        .toThrow('Cannot parse any type. Use a more specific type.')
    })
  })
})
