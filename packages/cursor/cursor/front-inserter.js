import { OutputIteratorAdaptor } from '../output-iterator-adaptor.js'

export function frontInserter(sequence) {
  return new OutputIteratorAdaptor((value) => {
    sequence.unshift(value)
  })
}
