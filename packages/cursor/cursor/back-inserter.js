import { OutputIteratorAdaptor } from '../output-iterator-adaptor.js'

export function backInserter(sequence) {
  return new OutputIteratorAdaptor((value) => {
    sequence.push(value)
  })
}
