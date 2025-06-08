import { CliReader } from './index.js'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Readable } from 'stream'
import { CliProcess } from '@kingjs/cli-process'

function getReader(value) {
  const readable = Readable.from(Buffer.from(value))
  return new CliReader(readable)
}

describe('A cli reader', () => {
  let emptyReader
  let singleLineReader
  let helloWorldReaderNl
  let helloWorldReader
  let helloNlWorldNlReader
  let lfNlReader
  let lfNlLfNlReader
  let helloCmaWorldCmaWsReader
  let processEnv = { env: { IFS: ' ,' } }
  beforeEach(() => {
    emptyReader = getReader('')
    singleLineReader = getReader('\n')
    helloWorldReaderNl = getReader('hello world\n')
    helloWorldReader = getReader('hello world')
    helloNlWorldNlReader = getReader('hello\nworld\n')
    lfNlReader = getReader('\r\n')
    lfNlLfNlReader = getReader('\r\n\r\n')
    helloCmaWorldCmaWsReader = getReader('hello, world, ')
  })
  describe('when readString is called', () => {
    it('should return null for an empty stream', async () => {
      const result = await emptyReader.readString()
      expect(result).toBeNull()
    })
    it('should return an empty string for a stream with a single empty line', async () => {
      const result = await singleLineReader.readString()
      expect(result).toBe('\n')
    })
    it('should return "hello world<nl>" for a stream with "hello world<nl>"', async () => {
      const result = await helloWorldReaderNl.readString()
      expect(result).toBe('hello world\n')
    })
    it('should return "hello world" for a stream with "hello world"', async () => {
      const result = await helloWorldReader.readString()
      expect(result).toBe('hello world')
    })
    it('should return "hello<nl>world<nl>" for a stream with "hello<nl>world<nl>"', async () => {
      const result = await helloNlWorldNlReader.readString()
      expect(result).toBe('hello\nworld\n')
    })
    it('should return "<lf><nl>" for a stream with "<lf><nl>"', async () => {
      const result = await lfNlReader.readString()
      expect(result).toBe('\r\n')
    })
    it('should return "<lf><nl><lf><nl>" for a stream with "<lf><nl><lf><nl>"', async () => {
      const result = await lfNlLfNlReader.readString()
      expect(result).toBe('\r\n\r\n')
    })
    describe('when in a CliProcess context with IFS=", "', () => {
      it('should return "hello, world" for a stream with "hello, world"', async () => {
        await CliProcess.create(processEnv, async () => {
          const result = await helloCmaWorldCmaWsReader.readString()
          expect(result).toBe('hello, world, ')
        })
      })
    }) 
  })
  describe('when readLine is called', () => {
    it('should return null for an empty stream', async () => {
      const result = await emptyReader.readLine()
      expect(result).toBeNull()
    })
    it('should return an empty string for a stream with a single empty line', async () => {
      const result = await singleLineReader.readLine()
      expect(result).toBe('')
    })
    it('should return "hello world" for a stream with "hello world<nl>"', async () => {
      const result = await helloWorldReaderNl.readLine()
      expect(result).toBe('hello world')
    })
    it('should return "hello world" for a stream with "hello world"', async () => {
      const result = await helloWorldReader.readLine()
      expect(result).toBe('hello world')
    })
    it('should return "hello" then "world" for a stream with "hello<nl>world<nl>"', async () => {
      const hello = await helloNlWorldNlReader.readLine()
      expect(hello).toBe('hello')
      const world = await helloNlWorldNlReader.readLine()
      expect(world).toBe('world')
    })
    it('should return an empty string for a stream with "<lf><nl>"', async () => {
      const result = await lfNlReader.readLine()
      expect(result).toBe('')
    })
    it('should return an empty string for a stream with "<lf><nl><lf><nl>"', async () => {
      const result = await lfNlLfNlReader.readLine()
      expect(result).toBe('')
    })
    describe('when called with options', () => {
      it('should return <lf><nl> when keepNewLines is true', async () => {
        const result = await lfNlReader.readLine({ keepNewLines: true })
        expect(result).toBe('\r\n')
      })
      it('should return <lf> when keepCarriageReturns is true', async () => {
        const result = await lfNlReader.readLine({ keepCarriageReturns: true })
        expect(result).toBe('\r')
      })
    })
    describe('when in a CliProcess context with IFS=", "', () => {
      it('should return "hello, world" for a stream with "hello, world"', async () => {
        await CliProcess.create(processEnv, async () => {
          const result = await helloCmaWorldCmaWsReader.readLine()
          expect(result).toBe('hello, world, ')
        })
      })
    })
  })
  describe('when readChar is called', () => {
    it('should return null for an empty stream', async () => {
      const result = await emptyReader.readChar()
      expect(result).toBeNull()
    })
    it('should return <nl> for a stream with a single empty line', async () => {
      const result = await singleLineReader.readChar()
      expect(result).toBe('\n')
    })
    it('should return "h" for a stream with "hello world<nl>"', async () => {
      const result = await helloWorldReaderNl.readChar()
      expect(result).toBe('h')
    })
    it('should return "h" for a stream with "hello world"', async () => {
      const result = await helloWorldReader.readChar()
      expect(result).toBe('h')
    })
    it('should return "h" for a stream with "hello<nl>world<nl>"', async () => {
      const result = await helloNlWorldNlReader.readChar()
      expect(result).toBe('h')
    })
    it('should return <lf> for a stream with "<lf><nl>"', async () => {
      const result = await lfNlReader.readChar()
      expect(result).toBe('\r')
    })
    it('should return <lf> for a stream with "<lf><nl><lf><nl>"', async () => {
      const result = await lfNlLfNlReader.readChar()
      expect(result).toBe('\r')
    })
    describe('when in a CliProcess context with IFS=", "', () => {
      it('should return "h" for a stream with "hello, world"', async () => {
        await CliProcess.create(processEnv, async () => {
          const result = await helloCmaWorldCmaWsReader.readChar()
          expect(result).toBe('h')
        })
      })
    })
  })
  describe('when iterated', () => {
    it('should yield null for an empty stream', async () => {
      const iterator = emptyReader[Symbol.asyncIterator]()
      const result = await iterator.next()
      expect(result.value).toBeUndefined()
      expect(result.done).toBe(true)
    })
    it('should yield an empty string for a stream with a single empty line', async () => {
      const iterator = singleLineReader[Symbol.asyncIterator]()
      const result = await iterator.next()
      expect(result.value).toBe('')
      expect(result.done).toBe(false)

      const nextResult = await iterator.next()
      expect(nextResult.value).toBeUndefined()
      expect(nextResult.done).toBe(true)
    })
    it('should yield "hello world" for a stream with "hello world<nl>"', async () => {
      const iterator = helloWorldReaderNl[Symbol.asyncIterator]()
      const result = await iterator.next()
      expect(result.value).toBe('hello world')
      expect(result.done).toBe(false)

      const nextResult = await iterator.next()
      expect(nextResult.value).toBeUndefined()
      expect(nextResult.done).toBe(true)
    })
    it('should yield "hello world" for a stream with "hello world"', async () => {
      const iterator = helloWorldReader[Symbol.asyncIterator]()
      const result = await iterator.next()
      expect(result.value).toBe('hello world')
      expect(result.done).toBe(false)

      const nextResult = await iterator.next()
      expect(nextResult.value).toBeUndefined()
      expect(nextResult.done).toBe(true)
    })
    it('should yield "hello" then "world" for a stream with "hello<nl>world<nl>"', async () => {
      const expected = ['hello', 'world']
      for await (const line of helloNlWorldNlReader) {
        expect(line).toBe(expected.shift())
      }
    })
    it('should yield an empty string for a stream with "<lf><nl>"', async () => {
      const iterator = lfNlReader[Symbol.asyncIterator]()
      
      const result0 = await iterator.next()
      expect(result0.value).toBe('')
      expect(result0.done).toBe(false)

      const result1 = await iterator.next()
      expect(result1.value).toBeUndefined()
      expect(result1.done).toBe(true)
    })
    it('should yield an empty string for a stream with "<lf><nl><lf><nl>"', async () => {
      const iterator = lfNlLfNlReader[Symbol.asyncIterator]()
      
      const result0 = await iterator.next()
      expect(result0.value).toBe('')
      expect(result0.done).toBe(false)

      const result1 = await iterator.next()
      expect(result1.value).toBe('')
      expect(result1.done).toBe(false)

      const result2 = await iterator.next()
      expect(result2.value).toBeUndefined()
      expect(result2.done).toBe(true)
    })
    describe('when called with options', () => {
      it('should yield <lf><nl> when keepNewLines is true', async () => {
        const iterator = lfNlReader[Symbol.asyncIterator]({ keepNewLines: true })
        const result = await iterator.next()
        expect(result.value).toBe('\r\n')
        expect(result.done).toBe(false)

        const nextResult = await iterator.next()
        expect(nextResult.value).toBeUndefined()
        expect(nextResult.done).toBe(true)
      })
      it('should yield <lf> when keepCarriageReturns is true', async () => {
        const iterator = lfNlReader[Symbol.asyncIterator]({ keepCarriageReturns: true })
        const result = await iterator.next()
        expect(result.value).toBe('\r')
        expect(result.done).toBe(false)

        const nextResult = await iterator.next()
        expect(nextResult.value).toBeUndefined()
        expect(nextResult.done).toBe(true)
      })
      it('should yield a single line when count is 1', async () => {
        {
          const iterator = helloNlWorldNlReader[Symbol.asyncIterator]({ count: 1 })
          const result = await iterator.next()
          expect(result.value).toBe('hello')
          expect(result.done).toBe(false)
  
          const nextResult = await iterator.next()
          expect(nextResult.value).toBeUndefined()
          expect(nextResult.done).toBe(true)
        }
        {
          const iterator = helloNlWorldNlReader[Symbol.asyncIterator]({ count: 1 })
          const result = await iterator.next()
          expect(result.value).toBe('world')
          expect(result.done).toBe(false)
  
          const nextResult = await iterator.next()
          expect(nextResult.value).toBeUndefined()
          expect(nextResult.done).toBe(true)
        }
      })
    })
    describe('when in a CliProcess context with IFS=", "', () => {
      it('should yield "hello, world" for a stream with "hello, world"', async () => {
        await CliProcess.create(processEnv, async () => {
          const iterator = helloCmaWorldCmaWsReader[Symbol.asyncIterator]()
          const result = await iterator.next()
          expect(result.value).toBe('hello, world, ')
          expect(result.done).toBe(false)

          const nextResult = await iterator.next()
          expect(nextResult.value).toBeUndefined()
          expect(nextResult.done).toBe(true)
        })
      })
    })
  })
  describe('when mapLines is called', () => {
    it('should return an empty array for an empty stream', async () => {
      await emptyReader.mapLines(() => expect().fail('should not be called'))
    })
    it('should return an empty array for a stream with a single empty line', async () => {
      const result = []
      await singleLineReader.mapLines(line => result.push(line))
      expect(result).toEqual([''])
    })
    it('should return ["hello world"] for a stream with "hello world<nl>"', async () => {
      const result = []
      await helloWorldReaderNl.mapLines(line => result.push(line))
      expect(result).toEqual(['hello world'])
    })
    it('should return ["hello world"] for a stream with "hello world"', async () => {
      const result = []
      await helloWorldReader.mapLines(line => result.push(line))
      expect(result).toEqual(['hello world'])
    })
    it('should return ["hello", "world"] for a stream with "hello<nl>world<nl>"', async () => {
      const result = []
      await helloNlWorldNlReader.mapLines(line => result.push(line))
      expect(result).toEqual(['hello', 'world'])
    })
    it('should return [""] for a stream with "<lf><nl>"', async () => {
      const result = []
      await lfNlReader.mapLines(line => result.push(line))
      expect(result).toEqual([''])
    })
    it('should return ["", ""] for a stream with "<lf><nl><lf><nl>"', async () => {
      const result = []
      await lfNlLfNlReader.mapLines(line => result.push(line))
      expect(result).toEqual(['', ''])
    })
    describe('when called with options', () => {
      it('should return <lf><nl> when keepNewLines is true', async () => {
        const result = []
        await lfNlReader.mapLines(line => result.push(line), { keepNewLines: true })
        expect(result).toEqual(['\r\n'])
      })
      it('should return <lf> when keepCarriageReturns is true', async () => {
        const result = []
        await lfNlReader.mapLines(line => result.push(line), { keepCarriageReturns: true })
        expect(result).toEqual(['\r'])
      })
    })
    describe('when in a CliProcess context with IFS=", "', () => {
      it('should return ["hello, world"] for a stream with "hello, world"', async () => {
        await CliProcess.create(processEnv, async () => {
          const result = []
          await helloCmaWorldCmaWsReader.mapLines(line => result.push(line))
          expect(result).toEqual(['hello, world, '])
        })
      })
    })
  })
  describe('when readLines is called', () => {
    it('should return an empty array for an empty stream', async () => {
      const result = await emptyReader.readLines()
      expect(result).toEqual([])
    })
    it('should return an array with an empty string for a stream with a single empty line', async () => {
      const result = await singleLineReader.readLines()
      expect(result).toEqual([''])
    })
    it('should return ["hello world"] for a stream with "hello world<nl>"', async () => {
      const result = await helloWorldReaderNl.readLines()
      expect(result).toEqual(['hello world'])
    })
    it('should return ["hello world"] for a stream with "hello world"', async () => {
      const result = await helloWorldReader.readLines()
      expect(result).toEqual(['hello world'])
    })
    it('should return ["hello", "world"] for a stream with "hello<nl>world<nl>"', async () => {
      const result = await helloNlWorldNlReader.readLines()
      expect(result).toEqual(['hello', 'world'])
    })
    it('should return [""] for a stream with "<lf><nl>"', async () => {
      const result = await lfNlReader.readLines()
      expect(result).toEqual([''])
    })
    it('should return ["", ""] for a stream with "<lf><nl><lf><nl>"', async () => {
      const result = await lfNlLfNlReader.readLines()
      expect(result).toEqual(['', ''])
    })
    describe('when called with options', () => {
      it('should return <lf><nl> when keepNewLines is true', async () => {
        const result = await lfNlReader.readLines({ keepNewLines: true })
        expect(result).toEqual(['\r\n'])
      })
      it('should return <lf> when keepCarriageReturns is true', async () => {
        const result = await lfNlReader.readLines({ keepCarriageReturns: true })
        expect(result).toEqual(['\r'])
      })
    })
    describe('when in a CliProcess context with IFS=", "', () => {
      it('should return ["hello, world"] for a stream with "hello, world"', async () => {
        await CliProcess.create(processEnv, async () => {
          const result = await helloCmaWorldCmaWsReader.readLines()
          expect(result).toEqual(['hello, world, '])
        })
      })
    })
  })
  describe('when readText is called', () => {
    it('should return null for an empty stream', async () => {
      const result = await emptyReader.readText()
      expect(result).toBeNull()
    })
    it('should return an empty string for a stream with a single empty line', async () => {
      const result = await singleLineReader.readText()
      expect(result).toBe('')
    })
    it('should return "hello world" for a stream with "hello world<nl>"', async () => {
      const result = await helloWorldReaderNl.readText()
      expect(result).toBe('hello world')
    })
    it('should return "hello world" for a stream with "hello world"', async () => {
      const result = await helloWorldReader.readText()
      expect(result).toBe('hello world')
    })
    it('should return "hello", "world" for a stream with "hello<nl>world<nl>"', async () => {
      const line0 = await helloNlWorldNlReader.readText()
      expect(line0).toBe('hello')
      const line1 = await helloNlWorldNlReader.readText()
      expect(line1).toBe('world')
    })
    it('should return "" for a stream with "<lf><nl>"', async () => {
      const result = await lfNlReader.readText()
      expect(result).toBe('')
    })
    it('should return "", "" for a stream with "<lf><nl><lf><nl>"', async () => {
      const line0 = await lfNlLfNlReader.readText()
      expect(line0).toBe('')
      const line1 = await lfNlLfNlReader.readText()
      expect(line1).toBe('')
    })
    describe('when called in a CliProcess context with IFS=", "', () => {
      it('should return "hello, world," for a stream with "hello, world, "', async () => {
        await CliProcess.create(processEnv, async () => {
          const result = await helloCmaWorldCmaWsReader.readText()
          expect(result).toBe('hello, world,')
        })
      })
    })
  })
  describe('when readFields is called', () => {
    describe('without passing types or count (Infinity)', () => {
      it('should return null for an empty stream', async () => {
        const result = await emptyReader.readFields()
        expect(result).toBeNull()
      })
      it('should return an empty array for a stream with a single empty line', async () => {
        const result = await singleLineReader.readFields()
        expect(result).toEqual([])
      })
      it('should return ["hello", "world"] for a stream with "hello world<nl>"', async () => {
        const result = await helloWorldReaderNl.readFields()
        expect(result).toEqual(['hello', 'world'])
      })
      it('should return ["hello", "world"] for a stream with "hello world"', async () => {
        const result = await helloWorldReader.readFields()
        expect(result).toEqual(['hello', 'world'])
      })
      it('should return ["hello"], ["world"] for a stream with "hello<nl>world<nl>"', async () => {
        const line0 = await helloNlWorldNlReader.readFields()
        expect(line0).toEqual(['hello'])
        const line1 = await helloNlWorldNlReader.readFields()
        expect(line1).toEqual(['world'])
      })
      it('should return [] for a stream with "<lf><nl>"', async () => {
        const result = await lfNlReader.readFields()
        expect(result).toEqual([])
      })
      it('should return [],[] for a stream with "<lf><nl><lf><nl>"', async () => {
        const line0 = await lfNlLfNlReader.readFields()
        expect(line0).toEqual([])
        const line1 = await lfNlLfNlReader.readFields()
        expect(line1).toEqual([])
        const end = await lfNlLfNlReader.readFields()
        expect(end).toBeNull()
      })
      describe('when called in a CliProcess context with IFS=", "', () => {
        it('should return ["hello", "world", ""] for a stream with "hello, world, "', async () => {
          await CliProcess.create(processEnv, async () => {
            const result = await helloCmaWorldCmaWsReader.readFields()
            expect(result).toEqual(['hello', 'world', ''])
          })
        })
      })
    })
    describe('when passing a count of 0', () => {
      const metadata = 0
      it('should return an empty array for an empty stream', async () => {
        const result = await emptyReader.readFields(metadata)
        expect(result).toBeNull()
      })
      it('should return an empty array for a stream with a single empty line', async () => {
        const result = await singleLineReader.readFields(metadata)
        expect(result).toEqual([])
      })
      it('should return an ["hello world"] for a stream with "hello world<nl>"', async () => {
        const result = await helloWorldReaderNl.readFields(metadata)
        expect(result).toEqual(["hello world"])
      })
      it('should return an ["hello world"] for a stream with "hello world"', async () => {
        const result = await helloWorldReader.readFields(metadata)
        expect(result).toEqual(["hello world"])
      })
      it('should return ["hello"], ["world"] for a stream with "hello<nl>world<nl>"', async () => {
        const line0 = await helloNlWorldNlReader.readFields(metadata)
        expect(line0).toEqual(["hello"])
        const line1 = await helloNlWorldNlReader.readFields(metadata)
        expect(line1).toEqual(["world"])
      })
      it('should return an empty array for a stream with "<lf><nl>"', async () => {
        const result = await lfNlReader.readFields(metadata)
        expect(result).toEqual([])
      })
      it('should return an empty array for a stream with "<lf><nl><lf><nl>"', async () => {
        const line0 = await lfNlLfNlReader.readFields(metadata)
        expect(line0).toEqual([])
        const line1 = await lfNlLfNlReader.readFields(metadata)
        expect(line1).toEqual([])
      })
      describe('when called in a CliProcess context with IFS=", "', () => {
        it('should return ["hello, world,"] for a stream with "hello, world, "', async () => {
          await CliProcess.create(processEnv, async () => {
            const result = await helloCmaWorldCmaWsReader.readFields(metadata)
            expect(result).toEqual(['hello, world,'])
          })
        })
      })
    })
    describe('when passing a count of 1', () => {
      const metadata = 1
      it('should return an empty array for an empty stream', async () => {
        const result = await emptyReader.readFields(metadata)
        expect(result).toBeNull()
      })
      it('should return [""] for a stream with a single empty line', async () => {
        const result = await singleLineReader.readFields(metadata)
        expect(result).toEqual([""])
      })
      it('should return ["hello", "world"] for a stream with "hello world<nl>"', async () => {
        const result = await helloWorldReaderNl.readFields(metadata)
        expect(result).toEqual(['hello', 'world'])
      })
      it('should return ["hello", "world"] for a stream with "hello world"', async () => {
        const result = await helloWorldReader.readFields(metadata)
        expect(result).toEqual(['hello', 'world'])
      })
      it('should return ["hello"] then ["world"] for a stream with "hello<nl>world<nl>"', async () => {
        const line0 = await helloNlWorldNlReader.readFields(metadata)
        expect(line0).toEqual(['hello'])
        const line1 = await helloNlWorldNlReader.readFields(metadata)
        expect(line1).toEqual(['world'])
      })
      it('should return [""] for a stream with "<lf><nl>"', async () => {
        const result = await lfNlReader.readFields(metadata)
        expect(result).toEqual([''])
      })
      it('should return [""],[""] for a stream with "<lf><nl><lf><nl>"', async () => {
        const line0 = await lfNlLfNlReader.readFields(metadata)
        expect(line0).toEqual([''])
        const line1 = await lfNlLfNlReader.readFields(metadata)
        expect(line1).toEqual([''])
      })
      describe('when called in a CliProcess context with IFS=", "', () => {
        it('should return ["hello", "world", ""] for a stream with "hello, world, "', async () => {
          await CliProcess.create(processEnv, async () => {
            const result = await helloCmaWorldCmaWsReader.readFields(metadata)
            expect(result).toEqual(['hello', 'world'])
          })
        })
      })
    })
    describe('when passing a count of 2', () => {
      const metadata = 2
      it('should return an empty array for an empty stream', async () => {
        const result = await emptyReader.readFields(metadata)
        expect(result).toBeNull()
      })
      it('should return ["", ""] for a stream with a single empty line', async () => {
        const result = await singleLineReader.readFields(metadata)
        expect(result).toEqual(["", ""])
      })
      it('should return ["hello", "world"] for a stream with "hello world<nl>"', async () => {
        const result = await helloWorldReaderNl.readFields(metadata)
        expect(result).toEqual(['hello', 'world'])
      })
      it('should return ["hello", "world"] for a stream with "hello world"', async () => {
        const result = await helloWorldReader.readFields(metadata)
        expect(result).toEqual(['hello', 'world'])
      })
      it('should return ["hello", ""], ["world", ""] for a stream with "hello<nl>world<nl>"', async () => {
        const line0 = await helloNlWorldNlReader.readFields(metadata)
        expect(line0).toEqual(['hello', ""])
        const line1 = await helloNlWorldNlReader.readFields(metadata)
        expect(line1).toEqual(['world', ""])
      })
      it('should return ["", ""] for a stream with "<lf><nl>"', async () => {
        const result = await lfNlReader.readFields(metadata)
        expect(result).toEqual(['', ''])
      })
      it('should return [""],[""] for a stream with "<lf><nl><lf><nl>"', async () => {
        const line0 = await lfNlLfNlReader.readFields(metadata)
        expect(line0).toEqual(['', ''])
        const line1 = await lfNlLfNlReader.readFields(metadata)
        expect(line1).toEqual(['', ''])
      })
      describe('when called in a CliProcess context with IFS=", "', () => {
        it('should return ["hello", "world"] for a stream with "hello, world, "', async () => {
          await CliProcess.create(processEnv, async () => {
            const result = await helloCmaWorldCmaWsReader.readFields(metadata)
            expect(result).toEqual(['hello', 'world'])
          })
        })
      })
    })
    describe('when passing types ["?", "!", "#"]', () => {
      const metadata = ['?', '!', '#']
      it('should return null for an empty stream', async () => {
        const result = await emptyReader.readFields(metadata)
        expect(result).toBeNull()
      })
      it('should return ["", false, NaN] for a stream with a single empty line', async () => {
        const result = await singleLineReader.readFields(metadata)
        expect(result).toEqual(['', false, NaN])
      })
      it('should return ["hello", true, NaN] for a stream with "hello world<nl>"', async () => {
        const result = await helloWorldReaderNl.readFields(metadata)
        expect(result).toEqual(['hello', true, NaN])
      })
      it('should return ["hello", true, NaN] for a stream with "hello world"', async () => {
        const result = await helloWorldReader.readFields(metadata)
        expect(result).toEqual(['hello', true, NaN])
      })
      it('should return ["hello", false, NaN], ["world", false, NaN] for a stream with "hello<nl>world<nl>"', async () => {
        const line0 = await helloNlWorldNlReader.readFields(metadata)
        expect(line0).toEqual(['hello', false, NaN])
        const line1 = await helloNlWorldNlReader.readFields(metadata)
        expect(line1).toEqual(['world', false, NaN])
      })
      it('should return ["", false, NaN] for a stream with "<lf><nl>"', async () => {
        const result = await lfNlReader.readFields(metadata)
        expect(result).toEqual(['', false, NaN])
      })
      it('should return ["", false, NaN], ["", false, NaN] for a stream with "<lf><nl><lf><nl>"', async () => {
        const line0 = await lfNlLfNlReader.readFields(metadata)
        expect(line0).toEqual(['', false, NaN])
        const line1 = await lfNlLfNlReader.readFields(metadata)
        expect(line1).toEqual(['', false, NaN])
      })
      describe('when called in a CliProcess context with IFS=", "', () => {
        it('should return ["hello", true, NaN] for a stream with "hello, world, "', async () => {
          await CliProcess.create(processEnv, async () => {
            const result = await helloCmaWorldCmaWsReader.readFields(metadata)
            expect(result).toEqual(['hello', true, NaN])
          })
        })
      })
    })
    describe('when passing explicit comment ["*"]', () => {
      const metadata = ['*']
      it('should return null for an empty stream', async () => {
        const result = await emptyReader.readFields(metadata)
        expect(result).toBeNull()
      })
      it('should return [""] for a stream with a single empty line', async () => {
        const result = await singleLineReader.readFields(metadata)
        expect(result).toEqual([''])
      })
      it('should return ["hello world"] for a stream with "hello world<nl>"', async () => {
        const result = await helloWorldReaderNl.readFields(metadata)
        expect(result).toEqual(['hello world'])
      })
      it('should return ["hello world"] for a stream with "hello world"', async () => {
        const result = await helloWorldReader.readFields(metadata)
        expect(result).toEqual(['hello world'])
      })
      it('should return ["hello"], ["world"] for a stream with "hello<nl>world<nl>"', async () => {
        const line0 = await helloNlWorldNlReader.readFields(metadata)
        expect(line0).toEqual(['hello'])
        const line1 = await helloNlWorldNlReader.readFields(metadata)
        expect(line1).toEqual(['world'])
      })
      it('should return [""] for a stream with "<lf><nl>"', async () => {
        const result = await lfNlReader.readFields(metadata)
        expect(result).toEqual([''])
      })
      it('should return ["", ""] for a stream with "<lf><nl><lf><nl>"', async () => {
        const line0 = await lfNlLfNlReader.readFields(metadata)
        expect(line0).toEqual([''])
        const line1 = await lfNlLfNlReader.readFields(metadata)
        expect(line1).toEqual([''])
      })
      describe('when called in a CliProcess context with IFS=", "', () => {
        it('should return ["hello, world,"] for a stream with "hello, world, "', async () => {
          await CliProcess.create(processEnv, async () => {
            const result = await helloCmaWorldCmaWsReader.readFields(metadata)
            expect(result).toEqual(['hello, world,'])
          })
        })
      })
    })
    describe('when passing implicit comment []', () => {
      const metadata = []
      it('should return null for an empty stream', async () => {
        const result = await emptyReader.readFields(metadata)
        expect(result).toBeNull()
      })
      it('should return [""] for a stream with a single empty line', async () => {
        const result = await singleLineReader.readFields(metadata)
        expect(result).toEqual([])
      })
      it('should return ["hello world"] for a stream with "hello world<nl>"', async () => {
        const result = await helloWorldReaderNl.readFields(metadata)
        expect(result).toEqual(['hello world'])
      })
      it('should return ["hello world"] for a stream with "hello world"', async () => {
        const result = await helloWorldReader.readFields(metadata)
        expect(result).toEqual(['hello world'])
      })
      it('should return ["hello"], ["world"] for a stream with "hello<nl>world<nl>"', async () => {
        const line0 = await helloNlWorldNlReader.readFields(metadata)
        expect(line0).toEqual(['hello'])
        const line1 = await helloNlWorldNlReader.readFields(metadata)
        expect(line1).toEqual(['world'])
      })
      it('should return [""] for a stream with "<lf><nl>"', async () => {
        const result = await lfNlReader.readFields(metadata)
        expect(result).toEqual([])
      })
      it('should return ["", ""] for a stream with "<lf><nl><lf><nl>"', async () => {
        const line0 = await lfNlLfNlReader.readFields(metadata)
        expect(line0).toEqual([])
        const line1 = await lfNlLfNlReader.readFields(metadata)
        expect(line1).toEqual([])
      })
      describe('when called in a CliProcess context with IFS=", "', () => {
        it('should return ["hello, world,"] for a stream with "hello, world, "', async () => {
          await CliProcess.create(processEnv, async () => {
            const result = await helloCmaWorldCmaWsReader.readFields(metadata)
            expect(result).toEqual(['hello, world,'])
          })
        })
      })
    })
    describe('when passing metadata that is not an array', () => {
      const metadata = { f0: '?', f1: '!', f2: '#' }
      it('should throw for any stream', async () => {
        const reader = new CliReader(Readable.from(Buffer.from('')))
        await expect(reader.readFields(metadata))
          .rejects.toThrow('Fields must be array of types or count.')
      })
    })
  })
  describe('when readRecord is called', () => {
    describe('without passing metadata (default comment)', () => {
      it('should return null for an empty stream', async () => {
        const result = await emptyReader.readRecord()
        expect(result).toBeNull()
      })
      it('should return empty object for a stream with a single empty line', async () => {
        const result = await singleLineReader.readRecord()
        expect(result).toEqual({})
      })
      it('should return { $: "hello world" } for a stream with "hello world<nl>"', async () => {
        const result = await helloWorldReaderNl.readRecord()
        expect(result).toEqual({ $: 'hello world' })
      })
      it('should return { $: "hello world" } for a stream with "hello world"', async () => {
        const result = await helloWorldReader.readRecord()
        expect(result).toEqual({ $: 'hello world' })
      })
      it('should return { $: "hello" }, { $: "world" } for a stream with "hello<nl>world<nl>"', async () => {
        const line0 = await helloNlWorldNlReader.readRecord()
        expect(line0).toEqual({ $: 'hello' })
        const line1 = await helloNlWorldNlReader.readRecord()
        expect(line1).toEqual({ $: 'world' })
      })
      it('should return { } for a stream with "<lf><nl>"', async () => {
        const result = await lfNlReader.readRecord()
        expect(result).toEqual({ })
      })
      it('should return { }, { } for a stream with "<lf><nl><lf><nl>"', async () => {
        const line0 = await lfNlLfNlReader.readRecord()
        expect(line0).toEqual({ })
        const line1 = await lfNlLfNlReader.readRecord()
        expect(line1).toEqual({ })
      })
      describe('when called in a CliProcess context with IFS=", "', () => {
        it('should return { $: "hello, world," } for a stream with "hello, world, "', async () => {
          await CliProcess.create(processEnv, async () => {
            const result = await helloCmaWorldCmaWsReader.readRecord()
            expect(result).toEqual({ $: 'hello, world,' })
          })
        })
      })
    })
    describe('when passing explicit comment metadata { $: "*" }', () => {
      const metadata = { $: '*' }
      it('should return null for an empty stream', async () => {
        const result = await emptyReader.readRecord(metadata)
        expect(result).toBeNull()
      })
      it('should return { $: "" } for a stream with a single empty line', async () => {
        const result = await singleLineReader.readRecord(metadata)
        expect(result).toEqual({ $: '' })
      })
      it('should return { $: "hello world" } for a stream with "hello world<nl>"', async () => {
        const result = await helloWorldReaderNl.readRecord(metadata)
        expect(result).toEqual({ $: 'hello world' })
      })
      it('should return { $: "hello world" } for a stream with "hello world"', async () => {
        const result = await helloWorldReader.readRecord(metadata)
        expect(result).toEqual({ $: 'hello world' })
      })
      it('should return { $: "hello" }, { $: "world" } for a stream with "hello<nl>world<nl>"', async () => {
        const line0 = await helloNlWorldNlReader.readRecord(metadata)
        expect(line0).toEqual({ $: 'hello' })
        const line1 = await helloNlWorldNlReader.readRecord(metadata)
        expect(line1).toEqual({ $: 'world' })
      })
      it('should return { } for a stream with "<lf><nl>"', async () => {
        const result = await lfNlReader.readRecord(metadata)
        expect(result).toEqual({ $: '' })
      })
      it('should return { }, { } for a stream with "<lf><nl><lf><nl>"', async () => {
        const line0 = await lfNlLfNlReader.readRecord(metadata)
        expect(line0).toEqual({ $: '' })
        const line1 = await lfNlLfNlReader.readRecord(metadata)
        expect(line1).toEqual({ $: '' })
      })
      describe('when called in a CliProcess context with IFS=", "', () => {
        it('should return { $: "hello, world," } for a stream with "hello, world, "', async () => {
          await CliProcess.create(processEnv, async () => {
            const result = await helloCmaWorldCmaWsReader.readRecord(metadata)
            expect(result).toEqual({ $: 'hello, world,' })
          })
        })
      })
    })
    describe('when passing { f0: "?" }', () => {
      const metadata = { f0: '?' }
      it('should return null for an empty stream', async () => {
        const result = await emptyReader.readRecord(metadata)
        expect(result).toBeNull()
      })
      it('should return { f0: "" } for a stream with a single empty line', async () => {
        const result = await singleLineReader.readRecord(metadata)
        expect(result).toEqual({ f0: '' })
      })
      it('should return { f0: "hello", $: "world" } for a stream with "hello world<nl>"', async () => {
        const result = await helloWorldReaderNl.readRecord(metadata)
        expect(result).toEqual({ f0: 'hello', $: 'world' })
      })
      it('should return { f0: "hello", $: "world" } for a stream with "hello world"', async () => {
        const result = await helloWorldReader.readRecord(metadata)
        expect(result).toEqual({ f0: 'hello', $: 'world' })
      })
      it('should return { f0: "hello" }, { f0: "world" } for a stream with "hello<nl>world<nl>"', async () => {
        const line0 = await helloNlWorldNlReader.readRecord(metadata)
        expect(line0).toEqual({ f0: 'hello' })
        const line1 = await helloNlWorldNlReader.readRecord(metadata)
        expect(line1).toEqual({ f0: 'world' })
      })
      it('should return { f0: "" } for a stream with "<lf><nl>"', async () => {
        const result = await lfNlReader.readRecord(metadata)
        expect(result).toEqual({ f0: '' })
      })
      it('should return { f0: "" }, { f0: "" } for a stream with "<lf><nl><lf><nl>"', async () => {
        const line0 = await lfNlLfNlReader.readRecord(metadata)
        expect(line0).toEqual({ f0: '' })
        const line1 = await lfNlLfNlReader.readRecord(metadata)
        expect(line1).toEqual({ f0: '' })
      })
      describe('when called in a CliProcess context with IFS=", "', () => {
        it('should return { f0: "hello, world," } for a stream with "hello, world, "', async () => {
          await CliProcess.create(processEnv, async () => {
            const result = await helloCmaWorldCmaWsReader.readRecord(metadata)
            expect(result).toEqual({ f0: 'hello', $: 'world' })
          })
        })
      })
    })
    describe('when passing { f0: "?", f1: "!", f2: "#" }', () => {
      const metadata = { f0: '?', f1: '!', f2: '#' }
      it('should return null for an empty stream', async () => {
        const result = await emptyReader.readRecord(metadata)
        expect(result).toBeNull()
      })
      it('should return { f0: "", f1: false, f2: NaN } for a stream with a single empty line', async () => {
        const result = await singleLineReader.readRecord(metadata)
        expect(result).toEqual({ f0: '', f1: false, f2: NaN })
      })
      it('should return { f0: "hello", f1: true, f2: NaN } for a stream with "hello world<nl>"', async () => {
        const result = await helloWorldReaderNl.readRecord(metadata)
        expect(result).toEqual({ f0: 'hello', f1: true, f2: NaN })
      })
      it('should return { f0: "hello", f1: true, f2: NaN } for a stream with "hello world"', async () => {
        const result = await helloWorldReader.readRecord(metadata)
        expect(result).toEqual({ f0: 'hello', f1: true, f2: NaN })
      })
      it('should return { f0: "hello", f1: false, f2: NaN }, { f0: "world", f1: false, f2: NaN } for a stream with "hello<nl>world<nl>"', async () => {
        const line0 = await helloNlWorldNlReader.readRecord(metadata)
        expect(line0).toEqual({ f0: 'hello', f1: false, f2: NaN })
        const line1 = await helloNlWorldNlReader.readRecord(metadata)
        expect(line1).toEqual({ f0: 'world', f1: false, f2: NaN })
      })
      it('should return { f0: "", f1: false, f2: NaN } for a stream with "<lf><nl>"', async () => {
        const result = await lfNlReader.readRecord(metadata)
        expect(result).toEqual({ f0: '', f1: false, f2: NaN })
      })
      it('should return x2 { f0: "", f1: false, f2: NaN } for a stream with "<lf><nl><lf><nl>"', async () => {
        const line0 = await lfNlLfNlReader.readRecord(metadata)
        expect(line0).toEqual({ f0: '', f1: false, f2: NaN })
        const line1 = await lfNlLfNlReader.readRecord(metadata)
        expect(line1).toEqual({ f0: '', f1: false, f2: NaN })
      })
      describe('when called in a CliProcess context with IFS=", "', () => {
        it('should return { f0: "hello", f1: true, f2: NaN } for a stream with "hello, world, "', async () => {
          await CliProcess.create(processEnv, async () => {
            const result = await helloCmaWorldCmaWsReader.readRecord(metadata)
            expect(result).toEqual({ f0: 'hello', f1: true, f2: NaN })
          })
        })
      })
    })
  })
  describe('when generateText is called', () => {
    it('should return an empty string for an empty stream', async () => {
      const result = await Array.fromAsync(emptyReader.generateText())
      expect(result).toEqual([])
    })
    it('should return an array with a single empty string for a stream with a single empty line', async () => {
      const result = await Array.fromAsync(singleLineReader.generateText())
      expect(result).toEqual([''])
    })
    it('should return ["hello world"] for a stream with "hello world<nl>"', async () => {
      const result = await Array.fromAsync(helloWorldReaderNl.generateText())
      expect(result).toEqual(['hello world'])
    })
    it('should return ["hello world"] for a stream with "hello world"', async () => {
      const result = await Array.fromAsync(helloWorldReader.generateText())
      expect(result).toEqual(['hello world'])
    })
    it('should return ["hello", "world"] for a stream with "hello<nl>world<nl>"', async () => {
      const result = await Array.fromAsync(helloNlWorldNlReader.generateText())
      expect(result).toEqual(['hello', 'world'])
    })
    it('should return [""] for a stream with "<lf><nl>"', async () => {
      const result = await Array.fromAsync(lfNlReader.generateText())
      expect(result).toEqual([''])
    })
    it('should return ["", ""] for a stream with "<lf><nl><lf><nl>"', async () => {
      const result = await Array.fromAsync(lfNlLfNlReader.generateText())
      expect(result).toEqual(['', ''])
    })
  })
  describe('when generateFields is called', () => {
    it('should return an empty array for an empty stream', async () => {
      const result = await Array.fromAsync(emptyReader.generateFields())
      expect(result).toEqual([])
    })
    it('should return an array with a single empty array for a stream with a single empty line', async () => {
      const result = await Array.fromAsync(singleLineReader.generateFields())
      expect(result).toEqual([[]])
    })
    it('should return [["hello", "world"]] for a stream with "hello world<nl>"', async () => {
      const result = await Array.fromAsync(helloWorldReaderNl.generateFields())
      expect(result).toEqual([['hello', 'world']])
    })
    it('should return [["hello", "world"]] for a stream with "hello world"', async () => {
      const result = await Array.fromAsync(helloWorldReader.generateFields())
      expect(result).toEqual([['hello', 'world']])
    })
    it('should return [["hello"], ["world"]] for a stream with "hello<nl>world<nl>"', async () => {
      const result = await Array.fromAsync(helloNlWorldNlReader.generateFields())
      expect(result).toEqual([['hello'], ['world']])
    })
    it('should return [[]] for a stream with "<lf><nl>"', async () => {
      const result = await Array.fromAsync(lfNlReader.generateFields())
      expect(result).toEqual([[]])
    })
    it('should return [[], []] for a stream with "<lf><nl><lf><nl>"', async () => {
      const result = await Array.fromAsync(lfNlLfNlReader.generateFields())
      expect(result).toEqual([[], []])
    })
  })
  describe('when generateRecords is called', () => {
    it('should return an empty array for an empty stream', async () => {
      const result = await Array.fromAsync(emptyReader.generateRecords())
      expect(result).toEqual([])
    })
    it('should return an array with a single empty object for a stream with a single empty line', async () => {
      const result = await Array.fromAsync(singleLineReader.generateRecords())
      expect(result).toEqual([{}])
    })
    it('should return [{ $: "hello world" }] for a stream with "hello world<nl>"', async () => {
      const result = await Array.fromAsync(helloWorldReaderNl.generateRecords())
      expect(result).toEqual([{ $: 'hello world' }])
    })
    it('should return [{ $: "hello world" }] for a stream with "hello world"', async () => {
      const result = await Array.fromAsync(helloWorldReader.generateRecords())
      expect(result).toEqual([{ $: 'hello world' }])
    })
    it('should return [{ $: "hello" }, { $: "world" }] for a stream with "hello<nl>world<nl>"', async () => {
      const result = await Array.fromAsync(helloNlWorldNlReader.generateRecords())
      expect(result).toEqual([{ $: 'hello' }, { $: 'world' }])
    })
    it('should return [{}] for a stream with "<lf><nl>"', async () => {
      const result = await Array.fromAsync(lfNlReader.generateRecords())
      expect(result).toEqual([{}])
    })
    it('should return [{}, {}] for a stream with "<lf><nl><lf><nl>"', async () => {
      const result = await Array.fromAsync(lfNlLfNlReader.generateRecords())
      expect(result).toEqual([{}, {}])
    })
  })
  describe('when operating with a hung stream', () => {
    let hangReadable, reader
    beforeEach(() => {
      hangReadable = new Readable({ read() { } })
      reader = new CliReader(hangReadable)
      setTimeout(() => reader.dispose(), 10)
    })
    it('should throw an error when reading a line', async () => {
      await expect(reader.readLine()).rejects.toThrow('Premature close')
    })
    it('should throw an error when reading text', async () => {
      await expect(reader.readText()).rejects.toThrow('Premature close')
    })
    it('should throw an error when reading fields', async () => {
      await expect(reader.readFields()).rejects.toThrow('Premature close')
    })
    it('should throw an error when reading a record', async () => {
      await expect(reader.readRecord()).rejects.toThrow('Premature close')
    })
  })
})