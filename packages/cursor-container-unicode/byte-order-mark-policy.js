import { assert } from '@kingjs/assert'
import { NativeByteOrder } from '@kingjs/unicode'

function assertByteOrder(byteOrder) {
  assert(byteOrder == 'big' || byteOrder == 'little',
    'Byte order must be big or little.')
}

function assertMark(mark, name) {
  assert(mark != null && typeof mark.length == 'number',
    `${name} byte order mark must be array-like.`)
}

function assertMarks(marks) {
  assert(marks != null,
    'Byte order marks are required.')

  assertMark(marks.big, 'Big-endian')
  assertMark(marks.little, 'Little-endian')
  assert(marks.big.length == marks.little.length,
    'Byte order marks must have the same length.')
}

function startsWith(values, prefix) {
  for (let i = 0; i < prefix.length; i++)
    if (values[i] != prefix[i])
      return false

  return true
}

export class ByteOrderMarkPolicy {
  static from(byteOrder, marks) {
    if (byteOrder == null)
      return new this({
        byteOrder: NativeByteOrder,
        marks,
        optional: true,
        strict: false,
      })

    if (typeof byteOrder == 'string')
      return new this({
        byteOrder,
        marks,
        optional: true,
        strict: true,
      })

    assert(false,
      'Byte order must be null or a byte order string.')
  }

  byteOrder
  optional
  strict
  marks

  constructor({
    byteOrder,
    marks,
    optional = true,
    strict = false,
  }) {
    assertByteOrder(byteOrder)
    assert(typeof optional == 'boolean',
      'Optional byte order mark setting must be boolean.')
    assert(typeof strict == 'boolean',
      'Strict byte order mark setting must be boolean.')

    this.byteOrder = byteOrder
    this.optional = optional
    this.strict = strict
    assertMarks(marks)
    this.marks = marks
  }

  inspect(prefix) {
    assertMark(prefix, 'Byte order mark prefix')

    const { byteOrder, optional, strict, marks } = this
    const { big, little } = marks

    if (prefix.length < big.length)
      return null

    if (startsWith(prefix, big))
      return strict && byteOrder != 'big'
        ? new Error('Byte order mark conflicts with byte order.')
        : 'big'

    if (startsWith(prefix, little))
      return strict && byteOrder != 'little'
        ? new Error('Byte order mark conflicts with byte order.')
        : 'little'

    return optional
      ? byteOrder
      : new Error('Byte order mark is required.')
  }
}
