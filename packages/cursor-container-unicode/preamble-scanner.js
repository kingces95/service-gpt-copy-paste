import { assert } from '@kingjs/assert'
import {
  matchPrefix,
  VirtualContainer,
} from '@kingjs/cursor-virtual'
import { TypedArrayView } from '@kingjs/cursor-view'

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
  _defaultMetadata
  _onPreamble
  _resolved
  _result
  _sequences

  constructor({ sequences, defaultMetadata = null, onPreamble = null }) {
    assert(onPreamble == null || typeof onPreamble == 'function',
      'Preamble callback must be a function.')

    this._sequences = normalizeSequences(sequences)
    const values = Object.values(this._sequences)
    assert(values.length > 0,
      'At least one preamble sequence is required.')

    for (const sequence of values)
      assertSequence(sequence)

    this._buffer = new VirtualContainer()
    this._defaultMetadata = defaultMetadata
    this._result = null
    this._onPreamble = onPreamble
    this._resolved = false
  }

  get result() { return this._result }

  pushRange(range) {
    assert(!this._resolved,
      'Preamble scanner has already resolved.')

    this._buffer.pushRange(range)
    this._tryResolve()
    return this._result
  }

  pushBytes(bytes) {
    return this.pushRange(new TypedArrayView(bytes))
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
    const key = match.state == 'matched'
      ? match.key
      : null

    if (match.state == 'matched')
      this._buffer.popRangeAt(match.end)

    const data = this._buffer

    this._resolved = true
    this._result = {
      key: key ?? this._defaultMetadata,
      data,
    }

    this._onPreamble?.(this._result)
  }
}
