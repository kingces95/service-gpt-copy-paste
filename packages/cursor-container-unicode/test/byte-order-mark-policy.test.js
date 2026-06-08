import { describe, expect, it } from 'vitest'
import {
  NativeByteOrder,
  Utf16ByteOrderMarks,
  Utf32ByteOrderMarks,
} from '@kingjs/unicode'
import { ByteOrderMarkPolicy } from '../index.js'

describe('ByteOrderMarkPolicy', () => {
  it('exports Unicode byte order marks', () => {
    expect(Utf16ByteOrderMarks.big).toEqual([0xfe, 0xff])
    expect(Utf16ByteOrderMarks.little).toEqual([0xff, 0xfe])
    expect(Utf32ByteOrderMarks.big).toEqual([0x00, 0x00, 0xfe, 0xff])
    expect(Utf32ByteOrderMarks.little).toEqual([0xff, 0xfe, 0x00, 0x00])
  })

  it('waits until the prefix is long enough to inspect', () => {
    const policy = new ByteOrderMarkPolicy({
      byteOrder: 'big',
      marks: Utf16ByteOrderMarks,
    })

    expect(policy.inspect([0xfe])).toBe(null)
  })

  it('detects UTF-16 and UTF-32 marks', () => {
    const utf16 = new ByteOrderMarkPolicy({
      byteOrder: 'big',
      marks: Utf16ByteOrderMarks,
      strict: false,
    })
    const utf32 = new ByteOrderMarkPolicy({
      byteOrder: 'big',
      marks: Utf32ByteOrderMarks,
      strict: false,
    })

    expect(utf16.inspect(Utf16ByteOrderMarks.big)).toBe('big')
    expect(utf16.inspect(Utf16ByteOrderMarks.little)).toBe('little')
    expect(utf32.inspect(Utf32ByteOrderMarks.big)).toBe('big')
    expect(utf32.inspect(Utf32ByteOrderMarks.little)).toBe('little')
  })

  it('uses the configured byte order when no optional mark is present', () => {
    const policy = new ByteOrderMarkPolicy({
      byteOrder: 'big',
      marks: Utf16ByteOrderMarks,
    })

    expect(policy.inspect([0x00, 0x61])).toBe('big')
  })

  it('returns an error when a required mark is absent', () => {
    const policy = new ByteOrderMarkPolicy({
      byteOrder: 'big',
      marks: Utf16ByteOrderMarks,
      optional: false,
    })

    expect(policy.inspect([0x00, 0x61]))
      .toEqual(new Error('Byte order mark is required.'))
  })

  it('rejects conflicting marks in strict mode', () => {
    const policy = new ByteOrderMarkPolicy({
      byteOrder: 'big',
      marks: Utf16ByteOrderMarks,
      strict: true,
    })

    expect(policy.inspect(Utf16ByteOrderMarks.little))
      .toEqual(new Error('Byte order mark conflicts with byte order.'))
  })

  it('lets marks override configured byte order outside strict mode', () => {
    const policy = new ByteOrderMarkPolicy({
      byteOrder: 'big',
      marks: Utf16ByteOrderMarks,
      strict: false,
    })

    expect(policy.inspect(Utf16ByteOrderMarks.little)).toBe('little')
  })

  it('normalizes missing byte order to native optional detection', () => {
    const policy = ByteOrderMarkPolicy.from(null, Utf16ByteOrderMarks)

    expect(policy.byteOrder).toBe(NativeByteOrder)
    expect(policy.optional).toBe(true)
    expect(policy.strict).toBe(false)
    expect(policy.inspect([0x00, 0x61])).toBe(NativeByteOrder)
  })

  it('normalizes explicit byte order to strict optional detection', () => {
    const policy = ByteOrderMarkPolicy.from('big', Utf16ByteOrderMarks)

    expect(policy.byteOrder).toBe('big')
    expect(policy.optional).toBe(true)
    expect(policy.strict).toBe(true)
    expect(policy.inspect([0x00, 0x61])).toBe('big')
    expect(policy.inspect(Utf16ByteOrderMarks.little))
      .toEqual(new Error('Byte order mark conflicts with byte order.'))
  })

  it('rejects policies as activation arguments', () => {
    const policy = new ByteOrderMarkPolicy({
      byteOrder: 'big',
      marks: Utf16ByteOrderMarks,
    })

    expect(() => ByteOrderMarkPolicy.from(policy, Utf16ByteOrderMarks))
      .toThrow('Byte order must be null or a byte order string.')
  })

  it('requires equal-length marks', () => {
    expect(() => new ByteOrderMarkPolicy({
      byteOrder: 'big',
      marks: {
        big: [0xfe],
        little: [0xff, 0xfe],
      },
    })).toThrow('Byte order marks must have the same length.')
  })
})
