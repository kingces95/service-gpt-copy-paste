import { assert } from '@kingjs/assert'
import { iterate } from '@kingjs/cursor-algorithm'
import { RangeContainer } from '@kingjs/cursor-container-ranges'

function normalizeSequences(sequences) {
  assert(sequences != null,
    'Preamble sequences are required.')

  if (Array.isArray(sequences))
    return sequences.map(values => ({ match: values, values }))

  return Object.entries(sequences)
    .map(([match, values]) => ({ match, values }))
}

function assertSequence(sequence) {
  assert(Array.isArray(sequence.values),
    'Preamble sequence values must be an array.')
  assert(sequence.values.length > 0,
    'Preamble sequence must not be empty.')
}

function startsWith(sequence, prefix) {
  if (prefix.length > sequence.length)
    return false

  for (let i = 0; i < prefix.length; i++)
    if (sequence[i] != prefix[i])
      return false

  return true
}

function takePrefix(range, count) {
  const result = []

  for (const value of iterate(range)) {
    if (result.length == count)
      break

    result.push(value)
  }

  return result
}

function step(cursor, count) {
  for (let i = 0; i < count; i++)
    cursor.step()

  return cursor
}

export class PreambleScanner {
  _buffer
  _maxLength
  _onPreamble
  _resolved
  _sequences

  constructor({ sequences, onPreamble }) {
    assert(typeof onPreamble == 'function',
      'Preamble callback is required.')

    this._sequences = normalizeSequences(sequences)
    assert(this._sequences.length > 0,
      'At least one preamble sequence is required.')

    for (const sequence of this._sequences)
      assertSequence(sequence)

    this._buffer = new RangeContainer()
    this._maxLength = Math.max(
      ...this._sequences.map(sequence => sequence.values.length)
    )
    this._onPreamble = onPreamble
    this._resolved = false
  }

  pushRange(range) {
    assert(!this._resolved,
      'Preamble scanner has already resolved.')

    this._buffer.pushRange(range)
    this._tryResolve()
    return this
  }

  _tryResolve() {
    const prefix = takePrefix(this._buffer, this._maxLength)
    if (prefix.length == 0)
      return

    let exact = null
    let couldMatch = false

    for (const sequence of this._sequences) {
      if (!startsWith(sequence.values, prefix))
        continue

      if (prefix.length == sequence.values.length)
        exact ??= sequence
      else
        couldMatch = true
    }

    if (exact && !couldMatch)
      return this._resolve(exact)

    if (!exact && !couldMatch)
      return this._resolve()
  }

  _resolve(sequence = null) {
    const cursor = step(
      this._buffer.begin(),
      sequence?.values.length ?? 0
    )
    const preamble = this._buffer.popRange(cursor)
    const remainder = this._buffer

    this._resolved = true
    this._onPreamble({
      match: sequence?.match ?? null,
      preamble,
      remainder,
    })
  }
}
