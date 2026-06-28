import { describe, expect, it } from 'vitest'
import { assert } from '@kingjs/assert'
import { iterate } from '@kingjs/cursor-algorithm'
import { TypedArrayView } from '@kingjs/cursor-view'
import { Uint8 } from '@kingjs/simple-type'
import { define } from '@kingjs/partial-define'
import { compose } from '@kingjs/partial-compose'
import {
  ProjectedRangePart,
  ProjectedRangeContainer,
  VirtualContainer,
} from '../index.js'

const Backslash = '\\'.codePointAt()
const Comma = ','.codePointAt()
const LineFeed = '\n'.codePointAt()

function bytesOf(text) {
  return new TypedArrayView(
    Uint8Array.from([...text].map(c => c.codePointAt()))
  )
}

function textOf(values) {
  return String.fromCodePoint(...values)
}

function materializeRecord(fields) {
  return fields.map(textOf)
}

function materializeRanges(ranges) {
  return [...ranges].map(range => textOf([...iterate(range)]))
}

class AsciiCodePointContainer extends ProjectedRangeContainer {
  constructor() {
    super(new VirtualContainer())
  }

  static {
    define(this, {
      decodeValue$(sourceCursor) {
        const value = sourceCursor.value
        assert(value instanceof Uint8 && value <= 0x7f,
          'Expected ASCII byte.')

        return value
      },
    })
  }
}

class DelimitedRecordContainer extends ProjectedRangeContainer {
  get isDelimiter$() {
    return this.constructor.isDelimiter
  }

  get isEscape$() {
    return this.constructor.isEscape
  }

  constructor() {
    super(new AsciiCodePointContainer())
  }

  static {
    compose(this, ProjectedRangePart, {
      trimEnd$(sourceCursor) {
        const cursor = this.source$.begin()

        while (true) {
          const stride = delimitedTokenStrideOf(
            this.source$,
            cursor,
            this.isDelimiter$,
            this.isEscape$,
            sourceCursor
          )
          if (stride == null)
            return cursor

          advance(cursor, stride)
        }
      },

      stepValue$(sourceCursor) {
        advance(sourceCursor, this.decodeStride$(sourceCursor))
      },
    })

    define(this, {
      decodeStride$(sourceCursor) {
        if (sourceCursor.equals(this.source$.end()))
          return null

        return delimitedTokenStrideOf(
          this.source$,
          sourceCursor,
          this.isDelimiter$,
          this.isEscape$
        )
      },
    })
  }
}

class CsvRecordContainer extends DelimitedRecordContainer {
  static isDelimiter = value => value == LineFeed

  static {
    define(this, {
      decodeValue$(sourceCursor) {
        const cursor = sourceCursor
        const end = this.source$.end()
        const fields = [[]]

        while (!cursor.equals(end)) {
          const value = cursor.value
          cursor.step()

          if (value == Comma) {
            fields.push([])
            continue
          }

          if (value == LineFeed)
            return fields

          fields[fields.length - 1].push(value)
        }

        return null
      },
    })
  }
}

class ReadRecordContainer extends DelimitedRecordContainer {
  static isDelimiter = value => value == LineFeed
  static isEscape = value => value == Backslash

  static {
    define(this, {
      decodeValue$(sourceCursor) {
        const values = []
        let escaped = false

        while (true) {
          const value = sourceCursor.value
          sourceCursor.step()

          if (escaped) {
            values.push(value)
            escaped = false
            continue
          }

          if (value == Backslash) {
            escaped = true
            continue
          }

          if (value == LineFeed)
            return values

          values.push(value)
        }
      },
    })
  }
}

describe('Delimited record regression', () => {
  it('scans ASCII records while committing original byte ranges', () => {
    const input = new CsvRecordContainer()

    input.pushRange(bytesOf('a,b'))

    expect([...iterate(input)]).toEqual([])

    input.pushRange(bytesOf(',c\nn'))

    const record = input.begin()
    expect(materializeRecord(record.value)).toEqual(['a', 'b', 'c'])

    record.step()

    const committed = input.popRangeAt(record)

    expect(materializeRanges(committed.ranges())).toEqual(['a,b', ',c\n'])
    expect([...iterate(input.source$)]).toEqual(['n'.codePointAt()])
    expect([...iterate(input)]).toEqual([])
  })

  it('lets read-style escapes suppress delimiter recognition', () => {
    const input = new ReadRecordContainer()

    input.pushRange(bytesOf('a\\'))

    expect([...iterate(input)]).toEqual([])

    input.pushRange(bytesOf('\nb\nx'))

    const record = input.begin()
    expect(textOf(record.value)).toBe('a\nb')

    record.step()

    const committed = input.popRangeAt(record)

    expect(materializeRanges(committed.ranges())).toEqual(['a\\', '\nb\n'])
    expect([...iterate(input.source$)]).toEqual(['x'.codePointAt()])
    expect([...iterate(input)]).toEqual([])
  })
})

function delimitedTokenStrideOf(
  range,
  cursor,
  isDelimiter,
  isEscape = null,
  end = range.end()
) {
  const current = cursor.clone()
  let escaped = false
  let stride = 0

  while (!current.equals(end)) {
    const value = current.value
    current.step()
    stride++

    if (escaped) {
      escaped = false
      continue
    }

    if (isEscape?.(value)) {
      escaped = true
      continue
    }

    if (isDelimiter(value))
      return stride
  }

  return null
}

function advance(cursor, count) {
  for (let i = 0; i < count; i++)
    cursor.step()
}
