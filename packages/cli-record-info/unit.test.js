import { CliRecordInfoLoader, CliRecordInfo } from './index.js'
import { CliFieldType } from '@kingjs/cli-field-type'
import { describe, it, expect, beforeEach } from 'vitest'
import { toBeEquals, toBeEmptyString } from '@kingjs/vitest'

expect.extend({ toBeEquals, toBeEmptyString })

describe('A CliRecordInfo loaded with metadata', () => {
  describe('that is missing', () => {
    let info
    beforeEach(() => {
      info = CliRecordInfoLoader.load()
    })
 
    it('should return a RecordInfo', () => {
      expect(info).toBeInstanceOf(CliRecordInfo)
    })
    it('should have a count of 1', () => {
      expect(info.count).toBe(1)
    })
    it('should be a string', () => {
      expect(info.isString).toBe(true)
    })
    it('should be text', () => {
      expect(info.isText).toBe(true)
      expect(info.type).toBe('text')
    })
    describe('can generate fields', () => {
      let generator
      beforeEach(() => { generator = info.fields() })

      describe('the first of which', () => {
        let firstField
        beforeEach(() => { firstField = generator.next().value })
        it('should be a comment', () => {
          expect(firstField.isComment).toBe(true)
        })
        it('should have no name', () => {
          expect(firstField.name).toBeNull()
        })
      })
    })
  })
  describe('that is the number 0', () => {
    let info
    beforeEach(() => {
      info = CliRecordInfoLoader.load(0)
    })

    it('should return a RecordInfo', () => {
      expect(info).toBeInstanceOf(CliRecordInfo)
    })
    it('should have a count of 1', () => {
      expect(info.count).toBe(1)
    })
    it('should be an array', () => {
      expect(info.isArray).toBe(true)
    })
    it('should be not user defined', () => {
      expect(info.isUserDefined).toBe(false)
    })
    it('should be words', () => {
      expect(info.type).toBe('words')
      expect(info.isWords).toBe(true)
    })
    describe('can generate fields', () => {
      let generator
      beforeEach(() => { generator = info.fields() })

      describe('the first of which', () => {
        let firstField
        beforeEach(() => {
          firstField = generator.next().value 
        })
        it('should be a comment', () => {
          expect(firstField.isComment).toBe(true)
        })
        it('should be implicit', () => {
          expect(firstField.isImplicit).toBe(true)
        })
        it('should have an undefined name', () => {
          expect(firstField.name).toBeNull()
        })
      })
    })
  })
  describe('that is an empty array', () => {
    let info
    beforeEach(() => {
      info = CliRecordInfoLoader.load([])
    })

    it('should return a RecordInfo', () => {
      expect(info).toBeInstanceOf(CliRecordInfo)
    })
    it('should have a count of 1', () => {
      expect(info.count).toBe(1)
    })
    it('should be an array', () => {
      expect(info.isArray).toBe(true)
    })
    it('should not be named', () => {
      expect(info.isNamed).toBe(false)
    })
    it('should be user defined', () => {
      expect(info.isUserDefined).toBe(true)
    })
    it('should not be named', () => {
      expect(info.isNamed).toBe(false)
    })
    describe('can generate fields', () => {
      let generator
      beforeEach(() => { generator = info.fields() })

      describe('the first of which', () => {
        let firstField
        beforeEach(() => { firstField = generator.next().value })
        it('should be a comment', () => {
          expect(firstField.isComment).toBe(true)
        })
        it('should be implicit', () => {
          expect(firstField.isImplicit).toBe(true)
        })
        it('should have an undefined name', () => {
          expect(firstField.name).toBeNull()
        })
      })
    })
  })
  describe('that is an empty object', () => {
    let info
    beforeEach(() => {
      info = CliRecordInfoLoader.load({})
    })

    it('should return a RecordInfo', () => {
      expect(info).toBeInstanceOf(CliRecordInfo)
    })
    it('should have a count of 1', () => {
      expect(info.count).toBe(1)
    })
    it('should be an object', () => {
      expect(info.isObject).toBe(true)
    })
    it('should be named', () => {
      expect(info.isNamed).toBe(true)
    })
    it('should be user defined type', () => {
      expect(info.type).toBe('udt')
    })
    describe('can generate fields', () => {
      let generator
      beforeEach(() => { generator = info.fields() })

      describe('the first of which', () => {
        let firstField
        beforeEach(() => { firstField = generator.next().value })
        it('should be a comment', () => {
          expect(firstField.isComment).toBe(true)
        })
        it('should be implicit', () => {
          expect(firstField.isImplicit).toBe(true)
        })
        it('should be named $', () => {
          expect(firstField.name).toBe('$')
        })
      })
    })
  })
  describe('that is the number 1', () => {
    let info
    beforeEach(() => {
      info = CliRecordInfoLoader.load(1)
    })

    it('should return a RecordInfo', () => {
      expect(info).toBeInstanceOf(CliRecordInfo)
    })
    it('should have a count of 2', () => {
      expect(info.count).toBe(2)
    })
    it('should be an array', () => {
      expect(info.isArray).toBe(true)
    })
    it('should not be user defined', () => {
      expect(info.isUserDefined).toBe(false)
    })
    it('should be words', () => {
      expect(info.type).toBe('words')
      expect(info.isWords).toBe(true)
    })
    describe('can generate fields', () => {
      let generator
      beforeEach(() => { generator = info.fields() })

      describe('the first of which', () => {
        let firstField
        beforeEach(() => { firstField = generator.next().value })
        it('should be a number', () => {
          expect(firstField.isWord).toBe(true)
        })
        it('should have an undefined name', () => {
          expect(firstField.name).toBeNull()
        })
      })
      describe('the second of which', () => {
        let secondField
        beforeEach(() => {
          generator.next() // skip first field
          secondField = generator.next().value 
        })
        it('should be a comment', () => {
          expect(secondField.isComment).toBe(true)
        })
        it('should be implicit', () => {
          expect(secondField.isImplicit).toBe(true)
        })
        it('should have an undefined name', () => {
          expect(secondField.name).toBeNull()
        })
      })
    })
  })
  describe('that is infinity', () => {
    let info
    beforeEach(() => {
      info = CliRecordInfoLoader.load(Infinity)
    })
 
    it('should return a RecordInfo', () => {
      expect(info).toBeInstanceOf(CliRecordInfo)
    })
    it('should have a count of Infinity', () => {
      expect(info.count).toBe(Infinity)
    })
    it('should be an array', () => {
      expect(info.isArray).toBe(true)
    })
    it('should not be a user defined', () => {
      expect(info.isUserDefined).toBe(false)
    })
    it('should be a list', () => {
      expect(info.isList).toBe(true)
      expect(info.type).toBe('list')
    })
    describe('can generate fields', () => {
      let generator
      beforeEach(() => { generator = info.fields() })

      describe('the first of which', () => {
        let firstField
        beforeEach(() => { firstField = generator.next().value })
        it('should be a word', () => {
          expect(firstField.isWord).toBe(true)
        })
        it('should have an undefined name', () => {
          expect(firstField.name).toBeNull()
        })
      })
    })
  })
  describe('that is an array of types ["#", "!", "?", "*"]', () => {
    let info
    beforeEach(() => {
      info = CliRecordInfoLoader.load(['#', '!', '?', '*'])
    })

    it('should return a RecordInfo', () => {
      expect(info).toBeInstanceOf(CliRecordInfo)
    })
    it('should have a count of 4', () => {
      expect(info.count).toBe(4)
    })
    it('should be an array', () => {
      expect(info.isArray).toBe(true)
    })
    it('should be user defined', () => {
      expect(info.isUserDefined).toBe(true)
      expect(info.type).toBe('udt')
    })
    it('should be not be named', () => {
      expect(info.isNamed).toBe(false)
    })
    describe('can generate fields', () => {
      let generator
      beforeEach(() => { generator = info.fields() })

      describe('the first of which', () => {
        let firstField
        beforeEach(() => { firstField = generator.next().value })

        it('should be a number', () => {
          expect(firstField.isNumber).toBe(true)
        })
        it('should have an undefined name', () => {
          expect(firstField.name).toBeNull()
        })
      })
      describe('the second of which', () => {
        let secondField
        beforeEach(() => {
          generator.next() // skip first field
          secondField = generator.next().value 
        })
        it('should be a boolean', () => {
          expect(secondField.isBoolean).toBe(true)
        })
        it('should have an undefined name', () => {
          expect(secondField.name).toBeNull()
        })
      })
      describe('the third of which', () => {
        let thirdField
        beforeEach(() => {
          generator.next() // skip first field
          generator.next() // skip second field
          thirdField = generator.next().value 
        })
        it('should be a word', () => {
          expect(thirdField.isWord).toBe(true)
        })
        it('should have an undefined name', () => {
          expect(thirdField.name).toBeNull()
        })
      })
      describe('the fourth of which', () => {
        let fourthField
        beforeEach(() => {
          generator.next() // skip first field
          generator.next() // skip second field
          generator.next() // skip thrid field
          fourthField = generator.next().value 
        })
        it('should be a comment', () => {
          expect(fourthField.isComment).toBe(true)
        })
        it('should not be implicit', () => {
          expect(fourthField.isImplicit).toBe(false)
        })
        it('should have an undefined name', () => {
          expect(fourthField.name).toBeNull()
        })
      })
    })
  })
  describe('that is an object with metadata { a: "#", b: "!", c: "?", d: "*" }', () => {
    let info
    beforeEach(() => {
      info = CliRecordInfoLoader.load({ a: '#', b: '!', c: '?', d: '*' })
    })

    it('should return a RecordInfo', () => {
      expect(info).toBeInstanceOf(CliRecordInfo)
    })
    it('should have a count of 4', () => {
      expect(info.count).toBe(4)
    })
    it('should be an object', () => {
      expect(info.isObject).toBe(true)
    })
    it('should be user defined', () => {
      expect(info.isUserDefined).toBe(true)
    })
    it('should be an named', () => {
      expect(info.isNamed).toBe(true)
    })
    describe('can generate fields', () => {
      let generator
      beforeEach(() => { generator = info.fields() })

      describe('the first of which', () => {
        let firstField
        beforeEach(() => { firstField = generator.next().value })

        it('should be a number', () => {
          expect(firstField.isNumber).toBe(true)
        })
        it('should have name "a"', () => {
          expect(firstField.name).toBe('a')
        })
      })
      describe('the second of which', () => {
        let secondField
        beforeEach(() => {
          generator.next() // skip first field
          secondField = generator.next().value 
        })
        it('should be a boolean', () => {
          expect(secondField.isBoolean).toBe(true)
        })
        it('should have name "b"', () => {
          expect(secondField.name).toBe('b')
        })
      })
      describe('the third of which', () => {
        let thirdField
        beforeEach(() => {
          generator.next() // skip first field
          generator.next() // skip second field
          thirdField = generator.next().value 
        })
        it('should be a word', () => {
          expect(thirdField.isWord).toBe(true)
        })
        it('should have name "c"', () => {
          expect(thirdField.name).toBe('c')
        })
      })
      describe('the fourth of which', () => {
        let fourthField
        beforeEach(() => {
          generator.next() // skip first field
          generator.next() // skip second field
          generator.next() // skip thrid field
          fourthField = generator.next().value 
        })
        it('should be a comment', () => {
          expect(fourthField.isComment).toBe(true)
        })
        it('should not be implicit', () => {
          expect(fourthField.isImplicit).toBe(false)
        })
        it('should have name "d"', () => {
          expect(fourthField.name).toBe('d')
        })
      })
    })
  })
  describe('that is an enum', () => {
    describe('loaded with metadata { type: { a: "#" }}', () => {
      let info
      beforeEach(() => {
        info = CliRecordInfoLoader.load({ type: { a: '#' }})
        // Given { type: { a: '#', b: '!' }, then
        //    a, 42 => { type: 'a': _: 42 }
        //    b, True, # boolean => { type: 'b': _: true, $: '# boolean' }
      })
      it('should return a RecordInfo', () => {
        expect(info).toBeInstanceOf(CliRecordInfo)
      })
      it('should have a count of 3', () => {
        expect(info.count).toBe(3)
      })
      it('should be an object', () => {
        expect(info.isObject).toBe(true)
      })
      it('should be user defined type', () => {
        expect(info.isUserDefined).toBe(true)
        expect(info.type).toBe('udt')
      })
      it('should be an named', () => {
        expect(info.isNamed).toBe(true)
      })
      describe('can generate fields', () => {
        let generator
        beforeEach(() => { generator = info.fields() })

        describe('the first of which', () => {
          let firstField
          beforeEach(() => { firstField = generator.next().value })
  
          it('should be an enum', () => {
            expect(firstField.isEnum).toBe(true)
          })
          it('should have name "type"', () => {
            expect(firstField.name).toBe('type')
          })
          it('should be discriminated by "a" as number type', () => {
            expect(firstField.discriminate('a')).toBe(CliFieldType.number)
          })
        })
        describe('the second of which', () => {
          let secondField
          beforeEach(() => {
            generator.next() // skip first field
            secondField = generator.next().value 
          })
          it('should be any', () => {
            expect(secondField.isAny).toBe(true)
          })
          it('should not be implicit', () => {
            expect(secondField.isImplicit).toBe(false)
          })
          it('should have name "_"', () => {
            expect(secondField.name).toBe('_')
          })
        })
        describe('the third of which', () => {
          let thirdField
          beforeEach(() => {
            generator.next() // skip first field
            generator.next() // skip second field
            thirdField = generator.next().value 
          })
          it('should be a comment', () => {
            expect(thirdField.isComment).toBe(true)
          })
          it('should be implicit', () => {
            expect(thirdField.isImplicit).toBe(true)
          })
          it('should have name "$"', () => {
            expect(thirdField.name).toBe('$')
          })
        })
      })
    })
    describe('loaded with metadata [ { a: "#" } ]', () => {
      let info
      beforeEach(() => {
        info = CliRecordInfoLoader.load([ { a: "#" } ])
      })
      it('should return a RecordInfo', () => {
        expect(info).toBeInstanceOf(CliRecordInfo)
      })
      it('should have a count of 3', () => {
        expect(info.count).toBe(3)
      })
      it('should be an object', () => {
        expect(info.isArray).toBe(true)
      })
      it('should be a user defined type', () => {
        expect(info.isUserDefined).toBe(true)
        expect(info.type).toBe('udt')
      })
      it('should not be named', () => {
        expect(info.isNamed).toBe(false)
      })
      describe('can generate fields', () => {
        let generator
        beforeEach(() => { generator = info.fields() })

        describe('the first of which', () => {
          let firstField
          beforeEach(() => { firstField = generator.next().value })
  
          it('should be an enum', () => {
            expect(firstField.isEnum).toBe(true)
          })
          it('should have no name', () => {
            expect(firstField.name).toBeNull()
          })
          it('should be discriminated by "a" as number type', () => {
            const numberType = CliFieldType.getType('#')
            expect(firstField.discriminate('a')).toBeInstanceOf(CliFieldType)
            expect(firstField.discriminate('a')).toBe(numberType)
          })
        })
        describe('the second of which', () => {
          let secondField
          beforeEach(() => {
            generator.next() // skip first field
            secondField = generator.next().value 
          })
          it('should be any', () => {
            expect(secondField.isAny).toBe(true)
          })
          it('should not be implicit', () => {
            expect(secondField.isImplicit).toBe(false)
          })
          it('should have no name', () => {
            expect(secondField.name).toBeNull()
          })
        })
        describe('the third of which', () => {
          let thirdField
          beforeEach(() => {
            generator.next() // skip first field
            generator.next() // skip second field
            thirdField = generator.next().value 
          })
          it('should be a comment', () => {
            expect(thirdField.isComment).toBe(true)
          })
          it('should be implicit', () => {
            expect(thirdField.isImplicit).toBe(true)
          })
          it('should have no name', () => {
            expect(thirdField.name).toBeNull()
          })
        })
      })
    })
  })
})
