import { assert } from '@kingjs/assert'
import {
  matchPrefix,
  VirtualContainer,
} from '@kingjs/cursor-virtual'

function normalizeSequences(sequences) {
  assert(sequences != null,
    'Preamble sequences are required.')

  if (Array.isArray(sequences))
    return sequences

  return sequences
}

function assertSequence(sequence) {
  assert(Array.isArray(sequence),
    'Preamble sequence values must be an array.')
  assert(sequence.length > 0,
    'Preamble sequence must not be empty.')
}

export class PreambleScanner {
  _buffer
  _onPreamble
  _resolved
  _sequences

  constructor({ sequences, onPreamble }) {
    assert(typeof onPreamble == 'function',
      'Preamble callback is required.')

    this._sequences = normalizeSequences(sequences)
    const values = Object.values(this._sequences)
    assert(values.length > 0,
      'At least one preamble sequence is required.')

    for (const sequence of values)
      assertSequence(sequence)

    this._buffer = new VirtualContainer()
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
    if (this._buffer.isEmpty)
      return

    const match = matchPrefix(this._buffer, this._sequences)
    if (match.state == 'pending')
      return

    this._resolve(match)
  }

  _resolve(match) {
    const preamble = match.state == 'matched'
      ? this._buffer.popRangeAt(match.end)
      : new VirtualContainer()
    const remainder = this._buffer

    this._resolved = true
    this._onPreamble({
      match: match.key ?? null,
      preamble,
      remainder,
    })
  }
}
