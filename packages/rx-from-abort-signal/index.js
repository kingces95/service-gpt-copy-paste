import { Observable } from 'rxjs';
import { AbortError } from '@kingjs/abort-error'

export function fromAbortSignal(signal) {
  return new Observable((observer) => {
    const abortHandler = () => {
      observer.error(new AbortError('fromAbortSignal'))
    }

    signal.addEventListener('abort', abortHandler)

    return () => {
      signal.removeEventListener('abort', abortHandler)
    }
  })
}
