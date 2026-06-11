import { assert } from '@kingjs/assert'

export function matchPrefix(range, sequences) {
  assert(sequences != null, 'Sequences are required.')

  let pending = false

  for (const [key, sequence] of entriesOf(sequences)) {
    const result = matchSequence(range, sequence)
    if (result.state == 'matched')
      return { state: 'matched', key, end: result.end }

    if (result.state == 'pending')
      pending = true
  }

  return pending ? { state: 'pending' } : { state: 'missed' }
}

function* entriesOf(sequences) {
  if (Array.isArray(sequences)) {
    for (let i = 0; i < sequences.length; i++)
      yield [i, sequences[i]]
    return
  }

  yield* Object.entries(sequences)
}

function matchSequence(range, sequence) {
  const current = range.begin()
  const end = range.end()

  for (const value of sequence) {
    if (current.equals(end))
      return { state: 'pending' }

    if (current.value != value)
      return { state: 'missed' }

    current.step()
  }

  return { state: 'matched', end: current }
}
