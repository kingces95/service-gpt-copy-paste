import { CliParser, CliSplitter, DEFAULT_IFS } from '@kingjs/cli-parser'
import { CliProcess } from '@kingjs/cli-process'
import { describe, it, expect, beforeEach } from 'vitest'
import { toBeEquals, toBeEmptyString } from '@kingjs/vitest'
import { CliRecordInfoLoader } from '@kingjs/cli-record-info'

expect.extend({ toBeEquals, toBeEmptyString })

const HELLO = 'hello'
const FOURTY_TWO = '42'
const SNAKE_FALSE = 'false'
const CAMAL_FALSE = 'False'
const TRUE = 'true'

describe('CliSplitter created with IFS', () => {
  describe('that is null', () => {
    it('should return a default IFS', async() => {
      await CliProcess.create({ env: { IFS: null } }, () => {
        const ifs = CliSplitter.ifs
        expect(ifs).toBe(DEFAULT_IFS)
      })
    })
  })
  describe('that is undefined', () => {
    it('should return a default IFS', async() => {
      await CliProcess.create({ env: { IFS: undefined } }, () => {
        const ifs = CliSplitter.ifs
        expect(ifs).toBe(DEFAULT_IFS)
      })
    })
  })
  describe('that is comma space', () => {
    it('should return a comma space IFS', async() => {
      await CliProcess.create({ env: { IFS: ', ' } }, () => {
        const ifs = CliSplitter.ifs
        expect(ifs).toBe(', ')
      })
    })
  })
})

describe('Parsing a line', () => {
  
  describe('that is empty', () => {
    const line = ''
    describe('with no metadata', () => {
      it('should return an empty string.', async () => {
        const array = CliParser.parse(line)
        expect(array).toEqual('')
      })
    })
    describe('with words metadata', () => {
      describe('with zero count', () => {
        const metadata = 0
        it('should return an empty string.', async () => {
          const array = CliParser.parse(line, metadata)
          expect(array).toEqual([])
        })
      })      
      describe('with one count', () => {
        const metadata = 1
        it('should return an array with an empty field.', async () => {
          const array = CliParser.parse(line, metadata)
          expect(array).toEqual([''])
        })
      })
      describe('with two count', () => {
        const metadata = 2
        it('should return an array with two empty fields.', async () => {
          const array = CliParser.parse(line, metadata)
          expect(array).toEqual(['', ''])
        })
      })
    })
    describe('with tuple metadata', () => {
      describe('with no types', () => {
        const metadata = []
        it('should return an empty array.', async () => {
          const array = CliParser.parse(line, metadata)
          expect(array).toEqual([])
        })
      })
      describe('with an explicit comment', () => {
        const metadata = ["*"]
        it('should return an empty array.', async () => {
          const array = CliParser.parse(line, metadata)
          expect(array).toEqual([''])
        })
      })
      describe('with a word type', () => {
        const metadata = ['?']
        it('should return an array with an empty string.', async () => {
          const array = CliParser.parse(line, metadata)
          expect(array).toEqual([''])
        })
      })
      describe('with a number type', () => {
        const metadata = ['#']
        it('should return an array with NaN.', async () => {
          const array = CliParser.parse(line, metadata)
          expect(array).toEqual([NaN])
        })
      })
      describe('with a boolean type', () => {
        const boolean = ['!']
        it('should return an array with false.', async () => {
          const array = CliParser.parse(line, boolean)
          expect(array).toEqual([false])
        })
      })
    })
    describe('with named metadata', () => {
      describe('with an empty field specification', () => {
        const metadata = {}
        it('should return en empty object.', async () => {
          const record = CliParser.parse(line, metadata)
          expect(record).toEqual({ })
        })
      })
      describe('with a single field specification', () => {
        describe('of explicit comment type', () => {
          const metadata = { f0: '*' }
          it('should return { f0: "" }.', async () => {
            const record = CliParser.parse(line, metadata)
            expect(record).toEqual({ f0: '' })
          })
        })
        describe('of word type', () => {
          const metadata = { f0: '?' }
          it('should return { f0: "" }.', async () => {
            const record = CliParser.parse(line, metadata)
            expect(record).toEqual({ f0: '' })
          })
        })
        describe('with a number type', () => {
          const metadata = { f0: '#' }
          it('should return { f0: NaN }.', async () => {
            const record = CliParser.parse(line, metadata)
            expect(record).toBeInstanceOf(Object)
            expect(record).toEqual({ f0: NaN })
          })
        })
        describe('with a boolean type', () => {
          const boolean = { f0: '!' }
          it('should return { f0: false }.', async () => {
            const record = CliParser.parse(line, boolean)
            expect(record).toEqual({ f0: false })
          })
        })
      })
      describe('with two field specification', () => {
        describe('with a string types', () => {
          it('should return a record with an empty strings.', async () => {
            const fields = { f0: 'word', f1: 'word' }
            const record = CliParser.parse(line, fields)
            expect(record).toEqual({ f0: '', f1: '' })
          })
        })
        describe('with number types', () => {
          it('should return a record with a NaN values.', async () => {
            const fields = { f0: 'number', f1: 'number' }
            const record = CliParser.parse(line, fields)
            expect(record).toEqual({ f0: NaN, f1: NaN })
          })
        })
        describe('with boolean types', () => {
          it('should return a record with false values.', async () => {
            const fields = { f0: 'boolean', f1: 'boolean' }
            const record = CliParser.parse(line, fields)
            expect(record).toEqual({ f0: false, f1: false })
          })
        })
      })
    })
    describe('with list metadata', () => {
      const metadata = Infinity
      it('should return an empty array.', async () => {
        const record = CliParser.parse(line, metadata)
        expect(record).toEqual([])
      })
    })
    describe('with pre-loaded metadata []', () => {
      const metadata = []
      let preLoadedMetadata
      beforeEach(() => preLoadedMetadata = CliRecordInfoLoader.load(metadata))
      it('should return an empty array.', async () => {
        const array = CliParser.parse(line, preLoadedMetadata)
        expect(array).toEqual([])
      })
    })
  })
  describe('that is a comment', () => {
    const comment = '# hello world'
    describe('with leading and trailing whitespace', () => {
      const line = `\t  ${comment}  \t`
      describe('with text metadata', () => {
        describe('with no metadata', () => {
          it('should return the comment.', async () => {
            const array = CliParser.parse(line)
            expect(array).toEqual(comment)
          })
        })
      })
      describe('with words metadata', () => {
        describe('with zero count', () => {
          const metadata = 0
          it('should return an array containing the comment.', async () => {
            const array = CliParser.parse(line, metadata)
            expect(array).toEqual([comment])
          })
        })
      })
      describe('with tuple metadata', () => {
        describe('with no types provided', () => {
          const metadata = []
          it('should return an array containing the comment.', async () => {
            const array = CliParser.parse(line, metadata)
            expect(array).toEqual([comment])
          })
        })
        describe('with an implicit comment', () => {
          const metadata = []
          it('should return an array containing the comment.', async () => {
            const array = CliParser.parse(line, metadata)
            expect(array).toEqual([comment])
          })
        })
        describe('with an explicit comment', () => {
          const metadata = ['*']
          it('should return an array containing the comment.', async () => {
            const array = CliParser.parse(line, metadata)
            expect(array).toEqual([comment])
          })
        })
      })
      describe('with named metadata', () => {
        describe('with a default comment', () => {
          const metadata = { }
          it('should return the comment in the default field.', async () => {
            const record = CliParser.parse(line, metadata)
            expect(record).toEqual({ $: comment })
          })
        })
        describe('with a named comment', () => {
          const metadata = { f0: "*" }
          it('should return the comment in the named field.', async () => {
            const record = CliParser.parse(line, metadata)
            expect(record).toEqual({ f0: comment })
          })
        })
      })
      describe('with list metadata', () => {
        const metadata = Infinity
        it('should return an array containing the split comment.', async () => {
          const array = CliParser.parse(line, metadata)
          expect(array).toEqual(comment.split(' '))
        })
      })
    })
    describe('with IFS containing non-whitespace', () => {
      const IFS = ', '
      const processEnv = { env: { IFS } }
      // The comment contains IFS, so the parser considers it
      // many fields surrounded by IFS as opposed to a single field
      // surrounded by IFS. That distinction is important and causes
      // the parser to distinguish between whitespace and non-whitespace
      // IFS characters. Since there are many fields remaining the parser
      // returns the entire line timmed of only leading and trailing 
      // *whitespace* IFS characters as opposed to trimmed of leading 
      // and trailing IFS characters whitespace or not. 
      describe('with leading and trailing whitespace IFS', () => {
        const line = ` ${comment} `
        it('should return the comment.', async () => {
          await CliProcess.create(processEnv, () => {
            const array = CliParser.parse(line)
            expect(array).toEqual(comment)
          })
        })
      })
      describe('with trailing non-whitespace IFS', () => {
        const line = ` ${comment} ,`
        it('should return the line trimmed of whitespace in an array.', async () => {
          await CliProcess.create(processEnv, () => {
            const array = CliParser.parse(line)
            expect(array).toEqual(`${comment} ,`)
          })
        })
      })
      describe('with leading and trailing non-whitespace IFS and whitespace', () => {
        const line = ` , ${comment} , `
        it('should return the line trimmed of whitespace in an array.', async () => {
          await CliProcess.create(processEnv, () => {
            const array = CliParser.parse(line)
            expect(array).toEqual(`, ${comment} ,`)
          })
        })
      })
    })    
  })
  describe('with a discriminator', () => {
    describe('but no discriminated value', () => {
      const line = 'number'
      describe('with unnamed user defined type', () => {
        const metadata = [{ number: '#' }]
        it('should return the discriminator and  default literal in an array', () => {
          const result = CliParser.parse(line, metadata)
          expect(result).toEqual(['number', NaN])
        })
      })
      describe('with named user defined type', () => {
        const metadata = { type: { number: '#' } }
        it('should return the discriminator and default literal in an object', () => {
          const result = CliParser.parse(line, metadata)
          expect(result).toEqual({ type: 'number', _: NaN })
        })
      })
    })
    describe('followed by a literal', () => {
      const line = 'number 42'
      const discriminator = { number: '#' }
      describe('with unnamed user defined type', () => {
        const metadata = [discriminator]
        it('should return the discriminator and literal in an array', () => {
          const result = CliParser.parse(line, metadata)
          expect(result).toEqual(['number', 42])
        })
      })
      describe('with named user defined type', () => {
        const metadata = { type: discriminator }
        it('should return the discriminator and literal in an object', () => {
          const result = CliParser.parse(line, metadata)
          expect(result).toEqual({ type: 'number', _: 42 })
        })
      })
    })
    describe('followed by a literal and a comment', () => {
      const line = 'number 42 # comment'
      const discriminator = { number: '#' }
      describe('with unnamed user defined type', () => {
        const metadata = [discriminator]
        it('should return the discriminator and literal in an array', () => {
          const result = CliParser.parse(line, metadata)
          expect(result).toEqual(['number', 42, '# comment'])
        })
      })
      describe('with named user defined type', () => {
        const metadata = { type: discriminator }
        it('should return the discriminator and literal in an object', () => {
          const result = CliParser.parse(line, metadata)
          expect(result).toEqual({ type: 'number', _: 42, $: '# comment' })
        })
      })
    })
    describe('followed by a comment', () => {
      const line = 'comment # hello world'
      const discriminator = { comment: '*' }
      describe('with unnamed user defined type', () => {
        const metadata = [discriminator]
        it('should return the discriminator and comment in an array', () => {
          const result = CliParser.parse(line, metadata)
          expect(result).toEqual(['comment', '# hello world'])
        })
      })
      describe('with named user defined type', () => {
        const metadata = { type: discriminator }
        it('should return the discriminator and comment in an object', () => {
          const result = CliParser.parse(line, metadata)
          expect(result).toEqual({ type: 'comment', _: '# hello world' })
        })
      })
    })
    describe('with IFS containing non-whitespace', () => {
      const IFS = ', '
      const processEnv = { env: { IFS } }
      describe('followed by an empty literal and a comment', () => {
        const line = 'number, , # comment'
        const discriminator = { number: '#' }
        describe('with unnamed user defined type', () => {
          const metadata = [discriminator]
          it('should return the discriminator, default, and comment in an array', 
            async () => {
              await CliProcess.create(processEnv, () => {
                const result = CliParser.parse(line, metadata)
                expect(result).toEqual(['number', NaN, '# comment'])
              })
            }
          )
        })
        describe('with named user defined type', () => {
          const metadata = { type: discriminator }
          it('should return the discriminator, default, and comment in an object', 
            async () => {
              await CliProcess.create(processEnv, () => {
                const result = CliParser.parse(line, metadata)
                expect(result).toEqual({ type: 'number', _: NaN, $: '# comment' })
              })
            }
          )
        })
      })
    })
    describe('followed by a complex type', () => {
      describe('consisting of text', () => {
        const line = 'comment # hello world'
        const discriminator = { comment: 0 }
        describe('with unnamed user defined type', () => {
          const metadata = [discriminator]
          it('should return the discriminator and comment in an array', () => {
            const result = CliParser.parse(line, metadata)
            expect(result).toEqual(['comment', ['# hello world']])
          })
        })
        describe('with named user defined type', () => {
          const metadata = { type: discriminator }
          it('should return the discriminator and comment in an object', () => {
            const result = CliParser.parse(line, metadata)
            expect(result).toEqual({ type: 'comment', _: ['# hello world'] })
          })
        })
      })
      describe('consisting of a list', () => {
        const line = 'comment # hello world'
        const discriminator = { comment: Infinity }
        describe('with unnamed user defined type', () => {
          const metadata = [discriminator]
          it('should return the discriminator and comment in an array', () => {
            const result = CliParser.parse(line, metadata)
            expect(result).toEqual(['comment', ['#', 'hello', 'world']])
          })
        })
        describe('with named user defined type', () => {
          const metadata = { type: discriminator }
          it('should return the discriminator and comment in an object', () => {
            const result = CliParser.parse(line, metadata)
            expect(result).toEqual({ type: 'comment', _: ['#', 'hello', 'world'] })
          })
        })
      })
      describe('consisting of words', () => {
        const line = 'comment # hello world'
        const discriminator = { comment: 1 }
        describe('with unnamed user defined type', () => {
          const metadata = [discriminator]
          it('should return the discriminator and comment in an array', () => {
            const result = CliParser.parse(line, metadata)
            expect(result).toEqual(['comment', ['#', 'hello world']])
          })
        })
        describe('with named user defined type', () => {
          const metadata = { type: discriminator }
          it('should return the discriminator and comment in an object', () => {
            const result = CliParser.parse(line, metadata)
            expect(result).toEqual({ type: 'comment', _: ['#', 'hello world'] })
          })
        })
      })
      describe('consisting of an unnamed user defined type', () => {
        const line = 'number 42'
        const discriminator = { number: ['#'] }
        describe('with unnamed user defined type', () => {
          const metadata = [discriminator]
          it('should return the discriminator and literal in an array', () => {
            const result = CliParser.parse(line, metadata)
            expect(result).toEqual(['number', [42]])
          })
        })
        describe('with named user defined type', () => {
          const metadata = { type: discriminator }
          it('should return the discriminator and literal in an object', () => {
            const result = CliParser.parse(line, metadata)
            expect(result).toEqual({ type: 'number', _: [42] })
          })
        })
      })
      describe('consisting of a named user defined type', () => {
        const line = 'number 42'
        const discriminator = { number: { age: '#' } }
        describe('with unnamed user defined type', () => {
          const metadata = [discriminator]
          it('should return the discriminator and literal in an array', () => {
            const result = CliParser.parse(line, metadata)
            expect(result).toEqual(['number', { age: 42 }])
          })
        })
        describe('with named user defined type', () => {
          const metadata = { type: discriminator }
          it('should return the discriminator and literal in an object', () => {
            const result = CliParser.parse(line, metadata)
            expect(result).toEqual({ type: 'number', _: { age: 42 } })
          })
        })
      })
    })
  })
  describe('with a field', () => {
    describe('with leading and trailing whitespace', () => {
      describe.each([
        ['word', HELLO, HELLO],
        ['?', HELLO, HELLO],
        ['number', FOURTY_TWO, 42],
        ['#', FOURTY_TWO, 42],
        ['boolean', TRUE, true],
        ['!', TRUE, true],
        ['boolean', SNAKE_FALSE, false],
        ['boolean', CAMAL_FALSE, false],
      ])('with type "%s" and value "%s"', (type, field, value) => {
        const line = ` ${field} `
        describe('with no metadata', () => {
          it(`should return the trimed unparsed value`, async () => {
            const array = CliParser.parse(line)
            expect(array).toEqual(line.trim())
          })
        })
        describe('with list metadata', () => {
          const metadata = Infinity
          it(`should return the trimed unparsed value in an array`, async () => {
            const array = CliParser.parse(line, metadata)
            expect(array).toEqual([line.trim()])
          })
        })
        describe('with words metadata', () => {
          const metadata = 1
          it(`should return the trimed unparsed value as the first element`, async () => {
            const array = CliParser.parse(line, metadata)
            expect(array).toEqual([line.trim()])
          })
        })
        describe('with tuple metadata', () => {
          const metadata = [type]
          it(`should return parsed value in an array.`, async () => {
            const array = CliParser.parse(line, metadata)
            expect(array).toEqual([value])
          })
        })
        describe(`with named metadata`, () => {
          const metadata = { f0: type }
          it(`should return parsed value in a field of an object.`, async () => {
            const record = CliParser.parse(line, metadata)
            expect(record).toBeInstanceOf(Object)
            expect(record).toEqual({ f0: value })
          })
        })      
      })
    })
    describe('with IFS containing non-whitespace', () => {
      const value = HELLO
      const IFS = ', '
      const processEnv = { env: { IFS } }
      describe('with trailing non-whitespace IFS', () => {
        const line = ` ${value} , `
        it('should return the line trimmed of any IFS.', async () => {
          await CliProcess.create(processEnv, () => {
            const array = CliParser.parse(line)
            expect(array).toEqual(value)
          })
        })
      })
      describe('with leading and trailing non-whitespace IFS', () => {
        const line = ` , ${value} , `
        it('should return the line trimmed of IFS whitespace.', async () => {
          await CliProcess.create(processEnv, () => {
            const array = CliParser.parse(line)
            expect(array).toEqual(`, ${value} ,`)
          })
        })
      })
      it.each([
        [' ff , ', 'ff'],
        [' f f , ', 'f f ,'],
        [' , ff', ', ff'],
        [', ff', ', ff'],
        [' ,ff', ',ff'],
        [' ,ff, ', ',ff,'],
        [' , ff , ', ', ff ,'],
      ])('with line "%s" parsed without metadata should return "%s".', 
        async (line, value) => {
          await CliProcess.create(processEnv, () => {
            const array = CliParser.parse(line)
            expect(array).toEqual(value)
          })
        }
      )
      describe('with a comment', () => {
        it.each([
          [' , f , ff ', ['','f , ff']],
          [' , , f , ff ', ['',', f , ff']],
          [' f , ff ', ['f','ff']],
          [' f , ff , ', ['f','ff']],
          [' f , f,f ', ['f','f,f']],
          [' f , ,f,f ', ['f',',f,f']],
          [' f ,f,f ', ['f','f,f']],
        ])('with line "%s" parsed without metadata should return "%s".', 
          async (line, value) => {
            await CliProcess.create(processEnv, () => {
              const array = CliParser.parse(line, 1)
              expect(array).toEqual(value)
            })
          }
        )
      })
    })    
    const line = `${HELLO}`
    describe('with no metadata', () => {
      it('should return the value.', async () => {
        const array = CliParser.parse(line)
        expect(array).toEqual(HELLO)
      })
    })
    describe('with list metadata', () => {
      const metadata = Infinity
      it('should return an array with only the value.', async () => {
        const array = CliParser.parse(line, metadata)
        expect(array).toEqual([HELLO])
      })
    })
    describe('with equal parts fields and data', () => {
      describe('with word count metadata', () => {
        const metadata = 1
        it('should return an array with only the value.', async () => {
          const array = CliParser.parse(line, metadata)
          expect(array).toEqual([HELLO])
        })
      })
      describe('with tuple metadata', () => {
        describe('with an explicit comment', () => {
          const metadata = ['?', '*']
          it('should return an array with the value and empty comment.', async () => {
            const array = CliParser.parse(line, metadata)
            expect(array).toEqual([HELLO, ""])
          })
        })
        describe('with an implicit comment', () => {
          const metadata = ['?']
          it('should return an array with only the value.', async () => {
            const array = CliParser.parse(line, metadata)
            expect(array).toEqual([HELLO])
          })
        })
      })
      describe('with named metadata', () => {
        describe('with an explicit comment', () => {
          const metadata = { f0: '?', f1: '*' }
          it('should return a default value for a missing comment.', async () => {
            const array = CliParser.parse(line, metadata)
            expect(array).toEqual({ f0: HELLO, f1: "" })
          })
        })
        describe('with default comment', () => {
          const metadata = { f0: '?' }
          it('should not set the default comment field.', async () => {
            const array = CliParser.parse(line, metadata)
            expect(array).toEqual({ f0: HELLO })
          })
        })
      })
    })
    describe('with more fields than data', () => {
      describe('with untyped metadata', () => {
        const metadata = 2
        it('should return an array with the value and an empty string.', async () => {
          const array = CliParser.parse(line, metadata)
          expect(array).toEqual([HELLO, ''])
        })
      })
      describe('with unnamed metadata', () => {
        const metadata = ['?', '#']
        it('should return an array with the value and a default value.', async () => {
          const array = CliParser.parse(line, metadata)
          expect(array).toEqual([HELLO, NaN])
        })
      })
      describe('with named metadata', () => {
        const metadata = { f0: '?', f1: '#' }
        it('should return a record with the value and a default value.', async () => {
          const record = CliParser.parse(line, metadata)
          expect(record).toEqual({ f0: HELLO, f1: NaN })
        })
      })
    })
  })
  describe('with two fields', () => {
    describe('surrounded by excess whitespace', () => {
      describe('separated by excess whitespace', () => {
        const line = ` ${FOURTY_TWO}  ${CAMAL_FALSE} `
        describe('with no metadata', () => {
          it('should return the trimmed line.', async () => {
            const array = CliParser.parse(line)
            expect(array).toEqual(line.trim())
          })
        })
        describe('with list metadata', () => {
          const metadata = Infinity
          it('should return an array with two strings.', async () => {
            const array = CliParser.parse(line, metadata)
            expect(array).toEqual([FOURTY_TWO, CAMAL_FALSE])
          })
        })
        describe('with word count metadata', () => {
          const metadata = 2
          it('should return an array with two strings.', async () => {
            const array = CliParser.parse(line, metadata)
            expect(array).toEqual([FOURTY_TWO, CAMAL_FALSE])
          })
        })
        describe('with tuple metadata', () => {
          const metadata = ['number', 'boolean']
          it('should return an array with two parsed values.', async () => {
            const array = CliParser.parse(line, metadata)
            expect(array).toEqual([Number.parseInt(FOURTY_TWO), false])
          })
        })
        describe('with named metadata', () => {
          const metadata = { f0: 'number', f1: 'boolean' }
          it('should return a record with two string values.', async () => {
            const record = CliParser.parse(line, metadata)
            expect(record).toEqual({ f0: Number.parseInt(FOURTY_TWO), f1: false })
          })
        })
      })
      describe('separated by a non IFS whitespace', () => {
        const IFS = ', '
        const processEnv = { env: { IFS } }
        const line = ` ${FOURTY_TWO} , ${CAMAL_FALSE} `
        describe('with no metadata', () => {
          it('should return the trimmed line.', async () => {
            await CliProcess.create(processEnv, () => {
              const array = CliParser.parse(line)
              expect(array).toEqual(line.trim())
            })
          })
        })
        describe('with list metadata', () => {
          const metadata = Infinity
          it('should return an array with two strings.', async () => {
            await CliProcess.create(processEnv, () => {
              const array = CliParser.parse(line, metadata)
              expect(array).toEqual([FOURTY_TWO, CAMAL_FALSE])
            })
          })
        })
        describe('with word count metadata', () => {
          const metadata = 2
          it('should return an array with two strings.', async () => {
            await CliProcess.create(processEnv, () => {
              const array = CliParser.parse(line, metadata)
              expect(array).toEqual([FOURTY_TWO, CAMAL_FALSE])
            })
          })
        })
        describe('with tuple metadata', () => {
          const metadata = ['number', 'boolean']
          it('should return an array with two parsed values.', async () => {
            await CliProcess.create(processEnv, async () => {
              const array = CliParser.parse(line, metadata)
              expect(array).toEqual([Number.parseInt(FOURTY_TWO), false])
            })
          })
        })
        describe('with named metadata', () => {
          const metadata = { f0: 'number', f1: 'boolean' }
          it('should return a record with two parsed values.', async () => {
            await CliProcess.create({ env: { IFS: ';, ' } }, async () => {
              const record = CliParser.parse(line, metadata)
              expect(record).toEqual({ f0: Number.parseInt(FOURTY_TWO), f1: false })
            })
          })
        })
      })
      describe('with more fields then data', () => {
        describe('separated by non IFS whitespace', () => {
          const IFS = ', '
          const processEnv = { env: { IFS } }
          const line = ` ${HELLO} , ${FOURTY_TWO} `
          describe('with word count metadata', () => {
            const metadata = 3
            it('should return an array with unparsed data and default values.', async () => {
              await CliProcess.create(processEnv, () => {
                const array = CliParser.parse(line, metadata)
                expect(array).toEqual([HELLO, '42', ""])
              })
            })
          })
          describe('with tuple metadata', () => {
            const metadata = ['?', '#', '!', '#', '?']
            it('should return an array with parsed data and default values.', async () => {
              await CliProcess.create(processEnv, () => {
                const array = CliParser.parse(line, metadata)
                expect(array).toEqual([HELLO, 42, false, NaN, ""])
              })
            })
          })
          describe('with named metadata', () => {
            const metadata = { f0: '?', f1: '#', f2: '!', f3: '#' }
            it('should return an object with parsed data and default values.', async () => {
              await CliProcess.create(processEnv, async () => {
                const record = CliParser.parse(line, metadata)
                expect(record).toEqual({ 
                  f0: HELLO, f1: Number.parseInt(FOURTY_TWO),
                  f2: false, f3: NaN 
                })
              })
            })
          })
        })
      })
    })
  })
  describe('with three fields', () => {
    describe('separated by non IFS whitespace', () => {
      const IFS = ',; '
      const processEnv = { env: { IFS } }
      describe('with only whitespace for the middle field', () => {
        const line = ` ${HELLO} ,  ;  ${FOURTY_TWO} `
        describe('parsed with untyped metadata', () => {
          const metadata = 3
          it('should return an array with three strings.', async () => {
            await CliProcess.create(processEnv, () => {
              const array = CliParser.parse(line, metadata)
              expect(array).toEqual([HELLO, '', FOURTY_TWO])
            })
          })
        })
        describe('parsed with unnamed metadata', () => {
          const metadata = ['?', '!', '#']
          it('should return an array with three strings.', async () => {
            await CliProcess.create(processEnv, () => {
              const array = CliParser.parse(line, metadata)
              expect(array).toEqual([HELLO, false, Number.parseInt(FOURTY_TWO)])
            })
          })
        })
        describe('parsed named metadata', () => {
          const metadata = { f0: '?', f1: '!', f2: '#' }
          it('should return a record with three string values.', async () => {
            await CliProcess.create(processEnv, async () => {
              const record = CliParser.parse(line, metadata)
              expect(record).toEqual({ 
                f0: HELLO, f1: false, f2: Number.parseInt(FOURTY_TWO) })
            })
          })
        })
      })
    })
  })
})
