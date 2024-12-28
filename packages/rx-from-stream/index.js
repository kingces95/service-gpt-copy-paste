import { Observable } from 'rxjs'

/**
 * Converts a Node.js stream into an RxJS Observable.
 * 
 * @param {stream.Readable} stream - The Node.js stream to convert.
 * @returns {Observable} An observable that emits data events and completes on end.
 */
function fromStream(stream) {
  return new Observable((subscriber) => {
    const onData = (data) => subscriber.next(data)
    const onEnd = () => subscriber.complete()
    const onError = (err) => subscriber.error(err)

    stream.on('data', onData)
    stream.on('end', onEnd)
    stream.on('error', onError)

    // Cleanup function
    return () => {
      stream.off('data', onData)
      stream.off('end', onEnd)
      stream.off('error', onError)
    }
  })
}

export default fromStream
