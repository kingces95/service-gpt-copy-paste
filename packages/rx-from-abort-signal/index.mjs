
import { Observable } from 'rxjs';

export default function fromAbortSignal(signal) {
  return new Observable((observer) => {
    const abortHandler = () => {
      observer.error(new Error('Aborted'))
    }

    signal.addEventListener('abort', abortHandler)

    return () => {
      signal.removeEventListener('abort', abortHandler)
    }
  })
}
