import { describe, expect, it } from 'vitest'
import { assert } from '@kingjs/assert'
import { iterate } from '@kingjs/cursor-algorithm'
import { SnapshotView } from '@kingjs/cursor-view'
import { Uint8 } from '@kingjs/simple-type'
import { Uint8Vector } from '@kingjs/cursor-container-standard'
import { define } from '@kingjs/partial-define'
import {
  FixedProjectedRangeContainer,
  ProjectedRangeCursor,
  ProjectedRangeContainer,
  RangeContainer,
} from '../index.js'

const Backslash = '\\'.codePointAt()
const Comma = ','.codePointAt()
const LineFeed = '\n'.codePointAt()

function bytesOf(text) {
  const result = new Uint8Vector()
  result.assignRange(new SnapshotView([...text].map(c => c.codePointAt())))
  return result
}

function textOf(values) {
  return String.fromCodePoint(...values)
}

function materializeRecord(fields) {
  return fields.map(textOf)
}

function materializeRanges(ranges) {
  return [...iterate(ranges)].map(range => textOf([...iterate(range)]))
}

class AsciiCodePointContainer extends FixedProjectedRangeContainer {
  constructor() {
    super(new RangeContainer(), { fixedStride: 1 })
  }

  static {
    define(this, {
      decodeToken$(sourceCursor) {
        const value = sourceCursor.value
        assert(value instanceof Uint8 && value <= 0x7f,
          'Expected ASCII byte.')

        return value
      },
    })
  }
}

class DelimitedRecordCursor extends ProjectedRangeCursor {
  static {
    define(this, {
      get stride$() {
        return this.container.decodeStride$(this.sourceCursor$)
      },
    })
  }
}

class DelimitedRecordContainer extends ProjectedRangeContainer {
  static cursorType = DelimitedRecordCursor

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
    define(this, {
      get sourceEnd$() {
        const cursor = this.source.begin()
        const end = this.source.end()

        while (true) {
          const stride = delimitedTokenStrideOf(
            this.source,
            cursor,
            this.isDelimiter$,
            this.isEscape$,
            end
          )
          if (stride == null)
            return cursor.clone()

          advance(cursor, stride)
        }
      },

      decodeStride$(sourceCursor) {
        if (sourceCursor.equals(this.source.end()))
          return null

        return delimitedTokenStrideOf(
          this.source,
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
      decodeToken$(sourceCursor) {
        const cursor = sourceCursor
        const end = this.source.end()
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
      decodeToken$(sourceCursor) {
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

    const committed = input.popRange(record)

    expect(materializeRanges(committed.ranges())).toEqual(['a,b', ',c\n'])
    expect([...iterate(input.source)]).toEqual(['n'.codePointAt()])
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

    const committed = input.popRange(record)

    expect(materializeRanges(committed.ranges())).toEqual(['a\\', '\nb\n'])
    expect([...iterate(input.source)]).toEqual(['x'.codePointAt()])
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
