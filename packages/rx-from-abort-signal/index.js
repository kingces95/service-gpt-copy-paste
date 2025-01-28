import { Observable } from 'rxjs';

class AbortError extends Error {
  constructor() {
    super('Aborted')
  }
}

function fromAbortSignal(signal) {
  return new Observable((observer) => {
    const abortHandler = () => {
      observer.error(new AbortError())
    }

    signal.addEventListener('abort', abortHandler)

    return () => {
      signal.removeEventListener('abort', abortHandler)
    }
  })
}

export {
  fromAbortSignal,
  AbortError
}