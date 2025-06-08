export class DisposedError extends Error {
  constructor(message = 'Disposed') {
    super(message)
  }
}
