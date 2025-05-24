import { CliParser, DEFAULT_IFS } from '@kingjs/cli-parser'
import { CliProcess } from '@kingjs/cli-process'
import { describe, it, expect, beforeEach } from 'vitest'
import { toBeEquals, toBeEmptyString } from '@kingjs/vitest'

expect.extend({ toBeEquals, toBeEmptyString })

const HELLO_WORLD = 'hello world'
const HELLO = 'hello'
const WORLD = 'world'
const FOURTY_TWO = '42'
const ZERO = '0'
const SNAKE_FALSE = 'false'
const CAMAL_FALSE = 'False'
const TRUE = 'true'

describe('toRecord', () => {
  it('should exist.', () => {
    expect(CliParser.toRecord).toBeInstanceOf(Function)
  })
  it('should return an empty object given an empty field specification.', async () => {
    const fields = {}
    const record = CliParser.toRecord(HELLO_WORLD, fields)
    expect(record).toBeInstanceOf(Object)
    expect(Object.keys(record).length).toBe(0)
  })
  it('should return an empty object given no field specification.', async () => {
    const record = CliParser.toRecord(HELLO_WORLD)
    expect(record).toBeInstanceOf(Object)
    expect(Object.keys(record).length).toBe(0)
  })

  describe('with an array field specification', () => {
    it('should exist.', () => {
      expect(CliParser.toRecord).toBeInstanceOf(Function)
    })
    it('should return an empty array given no count.', async () => {
      const array = CliParser.toArray(HELLO_WORLD)
      expect(array).toBeInstanceOf(Array)
      expect(array.length).toBe(0)
    })
    it('should return an empty array given zero count.', async () => {
      const array = CliParser.toArray(HELLO_WORLD, 0)
      expect(array).toBeInstanceOf(Array)
      expect(array.length).toBe(0)
    })
  })
})

describe('CliProcess with IFS', () => {
  describe('that is null', () => {
    it('should return a default IFS', async() => {
      await CliProcess.create({ env: { IFS: null } }, () => {
        const ifs = CliParser.ifs
        expect(ifs).toBe(DEFAULT_IFS)
      })
    })
  })
  describe('that is undefined', () => {
    it('should return a default IFS', async() => {
      await CliProcess.create({ env: { IFS: undefined } }, () => {
        const ifs = CliParser.ifs
        expect(ifs).toBe(DEFAULT_IFS)
      })
    })
  })
  describe('that is comma space', () => {
    it('should return a comma space IFS', async() => {
      await CliProcess.create({ env: { IFS: ', ' } }, () => {
        const ifs = CliParser.ifs
        expect(ifs).toBe(', ')
      })
    })
  })
})

describe('A line', () => {
  
  describe('that is empty', () => {
    const line = ''
    describe('parsed with toArray', () => {
      describe('with no count', () => {
        it('should return an empty array.', async () => {
          const array = CliParser.toArray(line)
          expect(array).toBeInstanceOf(Array)
          expect(array.length).toBe(0)
        })
      })
      describe('with zero count', () => {
        it('should return an empty array.', async () => {
          const array = CliParser.toArray(line, 0)
          expect(array).toBeInstanceOf(Array)
          expect(array.length).toBe(0)
        })
      })
      describe('with one count', () => {
        it('should return an array with one empty string.', async () => {
          const array = CliParser.toArray(line, 1)
          expect(array).toBeInstanceOf(Array)
          expect(array.length).toBe(1)
          expect(array[0]).toBeEmptyString()
        })
      })
      describe('with two count', () => {
        it('should return an array with en empty string and null.', async () => {
          const array = CliParser.toArray(line, 2)
          expect(array).toBeInstanceOf(Array)
          expect(array.length).toBe(2)
          expect(array[0]).toBeEmptyString()
          expect(array[1]).toBeEmptyString()
        })
      })
    })
    describe('parsed with toRecord', () => {
      describe('with an empty field specification', () => {
        it('should return an empty object.', async () => {
          const fields = {}
          const record = CliParser.toRecord(line, fields)
          expect(record).toBeInstanceOf(Object)
          expect(Object.keys(record).length).toBe(0)
        })
      })
      describe('with a single field specification', () => {
        describe('with a string type', () => {
          it('should return a record with a empty string.', async () => {
            const fields = { f0: 'string' }
            const record = CliParser.toRecord(line, fields)
            expect(record).toBeInstanceOf(Object)
            expect(record.f0).toBeEmptyString()
          })
        })
        describe('with a number type', () => {
          it('should return a record with a NaN value.', async () => {
            const fields = { f0: 'number' }
            const record = CliParser.toRecord(line, fields)
            expect(record).toBeInstanceOf(Object)
            expect(record.f0).toBeNaN()
          })
        })
        describe('with a boolean type', () => {
          it('should return a record with a false value.', async () => {
            const fields = { f0: 'boolean' }
            const record = CliParser.toRecord(line, fields)
            expect(record).toBeInstanceOf(Object)
            expect(record.f0).toBe(false)
          })
        })
      })
      describe('with two field specification', () => {
        describe('with a string types', () => {
          it('should return a record with an empty strings.', async () => {
            const fields = { f0: 'string', f1: 'string' }
            const record = CliParser.toRecord(line, fields)
            expect(record).toBeInstanceOf(Object)
            expect(record.f0).toBeEmptyString()
            expect(record.f1).toBeEmptyString()
          })
        })
        describe('with number types', () => {
          it('should return a record with a NaN values.', async () => {
            const fields = { f0: 'number', f1: 'number' }
            const record = CliParser.toRecord(line, fields)
            expect(record).toBeInstanceOf(Object)
            expect(record.f0).toBeNaN()
            expect(record.f1).toBeNaN()
          })
        })
        describe('with boolean types', () => {
          it('should return a record with false values.', async () => {
            const fields = { f0: 'boolean', f1: 'boolean' }
            const record = CliParser.toRecord(line, fields)
            expect(record).toBeInstanceOf(Object)
            expect(record.f0).toBe(false)
            expect(record.f1).toBe(false)
          })
        })
      })
    })
  })
  describe('that is a comment', () => {
    describe('with leading and trailing whitespace', () => {
      const comment = '# hello world'
      const line = ` ${comment} `
      describe('parsed with toArray', () => {
        describe('with one count', () => {
          it('should return an array with one string.', async () => {
            const array = CliParser.toArray(line, 1)
            expect(array).toBeInstanceOf(Array)
            expect(array.length).toBe(1)
            expect(array[0]).toBe(comment)
          })
        })
      })
      describe('parsed with toRecord', () => {
        describe('with a string type', () => {
          it('should return a record with a string value.', async () => {
            const fields = { f0: 'string' }
            const record = CliParser.toRecord(line, fields)
            expect(record).toBeInstanceOf(Object)
            expect(record.f0).toBe(comment)
          })
        })
      })
    })
  })
  describe('with a field', () => {
    describe('with leading and trailing whitespace', () => {
      describe('parsed with toArray', () => {
        const line = ` ${HELLO} `
        describe('with one count', () => {
          it('should return an array with one string.', async () => {
            const array = CliParser.toArray(line, 1)
            expect(array).toBeInstanceOf(Array)
            expect(array.length).toBe(1)
            expect(array[0]).toBe(HELLO)
          })
        })
        describe('with two count', () => {
          it('should return an array with the field and an empty string.', async () => {
            const array = CliParser.toArray(line, 2)
            expect(array).toBeInstanceOf(Array)
            expect(array.length).toBe(2)
            expect(array[0]).toBe(HELLO)
            expect(array[1]).toBeEmptyString()
          })
        })
        describe('with three count', () => {
          it('should return an array with the field, an empty string, and null.', async () => {
            const array = CliParser.toArray(line, 3)
            expect(array).toBeInstanceOf(Array)
            expect(array.length).toBe(3)
            expect(array[0]).toBe(HELLO)
            expect(array[1]).toBeEmptyString()
            expect(array[2]).toBeEmptyString()
          })
        })
      })
      describe('parsed with toRecord', () => {
        describe('specified with the type name', () => {
          describe('string', () => {
            const line = ` ${HELLO} `
            it('should return a record with a string value.', async () => {
              const fields = { f0: 'string' }
              const record = CliParser.toRecord(line, fields)
              expect(record).toBeInstanceOf(Object)
              expect(record.f0).toBe(HELLO)
            })
          })
          describe('number', () => {
            const line = ` ${FOURTY_TWO} `
            it('should return a record with a number value.', async () => {
              const fields = { f0: 'number' }
              const record = CliParser.toRecord(line, fields)
              expect(record).toBeInstanceOf(Object)
              expect(record.f0).toBe(Number.parseInt(FOURTY_TWO))
            })
          })
          describe('boolean', () => {
            describe('of true', () => {
              const line = ` ${TRUE} `
              it('should return a record with a boolean value true.', async () => {
                const fields = { f0: 'boolean' }
                const record = CliParser.toRecord(line, fields)
                expect(record).toBeInstanceOf(Object)
                expect(record.f0).toBe(true)
              })
            })
            describe('of false', () => {
              const line = ` ${SNAKE_FALSE} `
              it('should return a record with a boolean value false.', async () => {
                const fields = { f0: 'boolean' }
                const record = CliParser.toRecord(line, fields)
                expect(record).toBeInstanceOf(Object)
                expect(record.f0).toBe(false)
              })
            })
          })
        })
        describe('specified with the type alias', () => {
          describe('string', () => {
            const line = ` ${HELLO} `
            it('should return a record with a string value.', async () => {
              const fields = { f0: null }
              const record = CliParser.toRecord(line, fields)
              expect(record.f0).toBe(HELLO)
            })
          })
          describe('number', () => {
            const line = ` ${FOURTY_TWO} `
            it('should return a record with a number value.', async () => {
              const fields = { f0: '#' }
              const record = CliParser.toRecord(line, fields)
              expect(record.f0).toBe(Number.parseInt(FOURTY_TWO))
            })
          })
          describe('boolean', () => {
            describe('of true', () => {
              const line = ` ${TRUE} `
              it('should return a record with a boolean value true.', async () => {
                const fields = { f0: '!' }
                const record = CliParser.toRecord(line, fields)
                expect(record.f0).toBe(true)
              })
            })
            describe('of false', () => {
              const line = ` ${SNAKE_FALSE} `
              it('should return a record with a boolean value false.', async () => {
                const fields = { f0: '!' }
                const record = CliParser.toRecord(line, fields)
                expect(record.f0).toBe(false)
              })
            })
          })
        })
      })
    })
    describe('with trailing non IFS whitespace', () => {
      const line = ` ${HELLO} , `
      describe('parsed with toArray', () => {
        it('should return an array with one string with non IFS whitespace.', async () => {
          await CliProcess.create({ env: { IFS: ', ' } }, () => {
            const array = CliParser.toArray(line, 1)
            expect(array).toBeInstanceOf(Array)
            expect(array.length).toBe(1)
            expect(array[0]).toBe(`${HELLO} ,`)
          })
        })
      })
      describe('parsed with toRecord', () => {
        it('should return a record with a string value with non IFS whitespace.', async () => {
          await CliProcess.create({ env: { IFS: ', ' } }, async () => {
            const fields = { f0: 'string' }
            const record = CliParser.toRecord(line, fields)
            expect(record).toBeInstanceOf(Object)
            expect(record.f0).toBe(`${HELLO} ,`)
          })
        })
      })
    })
    describe('parsed with toRecord with a typed field', () => {
      describe('with a string type', () => {
        const line = ` ${HELLO} `
        describe('specified as "string"', () => {
          it('should return a record with a string value.', async () => {
            const fields = { f0: 'string' }
            const record = CliParser.toRecord(line, fields)
            expect(record).toBeInstanceOf(Object)
            expect(record.f0).toBe(HELLO)
          })
        })
        describe('specified as null', () => {
          it('should return a record with a string value.', async () => {
            const fields = { f0: null }
            const record = CliParser.toRecord(line, fields)
            expect(record).toBeInstanceOf(Object)
            expect(record.f0).toBe(HELLO)
          })
        })
      })
      describe('with a number type', () => {
        const line = ` ${FOURTY_TWO} `
        describe('specified as "number"', () => {
          it('should return a record with a number value.', async () => {
            const fields = { f0: 'number' }
            const record = CliParser.toRecord(line, fields)
            expect(record).toBeInstanceOf(Object)
            expect(record.f0).toBe(Number.parseInt(FOURTY_TWO))
          })
        })
        describe('specified as "#"', () => {
          it('should return a record with a number value.', async () => {
            const fields = { f0: '#' }
            const record = CliParser.toRecord(line, fields)
            expect(record).toBeInstanceOf(Object)
            expect(record.f0).toBe(Number.parseInt(FOURTY_TWO))
          })
        })
      })
      describe('with a boolean type', () => {
        const line = ` ${CAMAL_FALSE} `
        describe('specified as "boolean"', () => {
          it('should return a record with a boolean value.', async () => {
            const fields = { f0: 'boolean' }
            const record = CliParser.toRecord(line, fields)
            expect(record).toBeInstanceOf(Object)
            expect(record.f0).toBe(false)
          })
        })
        describe('specified as "!"', () => {
          it('should return a record with a boolean value.', async () => {
            const fields = { f0: '!' }
            const record = CliParser.toRecord(line, fields)
            expect(record).toBeInstanceOf(Object)
            expect(record.f0).toBe(false)
          })
        })
      })
    })
    describe('and a comment', () => {
      const comment = '# comment'
      const line = ` ${HELLO} ${comment} `
      describe('parsed with toArray with count 2', () => {
        it('should return an array with one string.', async () => {
          const array = CliParser.toArray(line, 2)
          expect(array).toBeInstanceOf(Array)
          expect(array.length).toBe(2)
          expect(array[0]).toBe(HELLO)
          expect(array[1]).toBe(comment)
        })
      })
      describe('parsed with toRecord', () => {
        it('should return a record with a string value.', async () => {
          const fields = { f0: 'string', comment: 'string' }
          const record = CliParser.toRecord(line, fields)
          expect(record).toBeInstanceOf(Object)
          expect(record.f0).toBe(HELLO)
          expect(record.comment).toBe(comment)
        })
      })
    })
  })
  describe('with two fields', () => {
    describe('surrounded by excess whitespace', () => {
      describe('separated by excess whitespace', () => {
        const line = ` ${FOURTY_TWO}  ${CAMAL_FALSE} `
        describe('parsed with toArray', () => {
          it('should return an array with two strings.', async () => {
            const array = CliParser.toArray(line, 2)
            expect(array).toBeInstanceOf(Array)
            expect(array.length).toBe(2)
            expect(array[0]).toBe(FOURTY_TWO)
            expect(array[1]).toBe(CAMAL_FALSE)
          })
        })
        describe('parsed with toRecord', () => {
          it('should return a record with two string values.', async () => {
            const fields = { f0: 'number', f1: 'boolean' }
            const record = CliParser.toRecord(line, fields)
            expect(record).toBeInstanceOf(Object)
            expect(record.f0).toBe(Number.parseInt(FOURTY_TWO))
            expect(record.f1).toBe(false)
          })
        })
      })
      describe('separated by a non IFS whitespace', () => {
        const line = ` ${FOURTY_TWO} , ${CAMAL_FALSE} `
        describe('parsed with toArray', () => {
          it('should return an array with two strings.', async () => {
            await CliProcess.create({ env: { IFS: ';, ' } }, () => {
              const array = CliParser.toArray(line, 2)
              expect(array).toBeInstanceOf(Array)
              expect(array.length).toBe(2)
              expect(array[0]).toBe(FOURTY_TWO)
              expect(array[1]).toBe(CAMAL_FALSE)
            })
          })
        })
        describe('parsed with toRecord', () => {
          it('should return a record with two string values.', async () => {
            await CliProcess.create({ env: { IFS: ';, ' } }, async () => {
              const fields = { f0: 'number', f1: 'boolean' }
              const record = CliParser.toRecord(line, fields)
              expect(record).toBeInstanceOf(Object)
              expect(record.f0).toBe(Number.parseInt(FOURTY_TWO))
              expect(record.f1).toBe(false)
            })
          })
        })
      })
    })
  })
  describe('with three fields', () => {
    describe('separated by non IFS whitespace', () => {
      describe('with only whitespace for the middle field', () => {
        const line = ` ${HELLO} ,  ;  ${WORLD} `
        describe('parsed with toArray', () => {
          it('should return an array with three strings.', async () => {
            await CliProcess.create({ env: { IFS: ';, ' } }, () => {
              const array = CliParser.toArray(line, 3)
              expect(array).toBeInstanceOf(Array)
              expect(array.length).toBe(3)
              expect(array[0]).toBe(HELLO)
              expect(array[1]).toBeEmptyString()
              expect(array[2]).toBe(WORLD)
            })
          })
        })
        describe('parsed with toRecord', () => {
          it('should return a record with three string values.', async () => {
            await CliProcess.create({ env: { IFS: ';, ' } }, async () => {
              const fields = { f0: 'string', f1: 'string', f2: 'string' }
              const record = CliParser.toRecord(line, fields)
              expect(record).toBeInstanceOf(Object)
              expect(record.f0).toBe(HELLO)
              expect(record.f1).toBeEmptyString()
              expect(record.f2).toBe(WORLD)
            })
          })
        })
      })
    })
  })
})
