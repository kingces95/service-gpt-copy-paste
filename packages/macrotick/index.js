import { AbortError } from '@kingjs/abort-error'

// When reading a line from stdin fails, the process may need to throw an error,
// but the type of error depends on whether the failure was due to user abort
// (e.g. Ctrl+C) or some other cause (e.g. malformed input).
//
// Some shells may close stdin before delivering SIGINT. If the process detects
// that stdin has closed, it needs to know whether that was caused by an abort.
// If so, it should throw an AbortError. If not, it should throw a regular Error.
//
// This distinction matters because AbortError typically represents user intent
// and is handled quietly (e.g. no stack trace), while a regular Error suggests
// an unexpected condition and may be logged or crash the process.
//
// To give the AbortController time to update signal.aborted, we wait one tick
// after the failed read before deciding which error to throw.

export async function macrotick(signal) {
  await new Promise(resolve => setTimeout(resolve, 0))
  if (signal?.aborted)
    throw new AbortError()
}