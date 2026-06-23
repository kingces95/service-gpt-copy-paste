import { Observable } from 'rxjs'
import { mergeMap } from 'rxjs/operators'
import { UnicodeActivator } from '@kingjs/cursor-container-unicode'

export function activateUnicode(options) {
  return source => new Observable(subscriber => {
    const activator = new UnicodeActivator(options)

    return source.subscribe({
      next(range) {
        try {
          const container = activator.pushRange(range)
          if (container)
            subscriber.next(container)
        }
        catch (error) {
          subscriber.error(error)
        }
      },
      error(error) { subscriber.error(error) },
      complete() { subscriber.complete() },
    })
  })
}

export function splitOnCodePoints(delimiter, {
  includeDelimiter = false,
} = { }) {
  const codePoints = [...delimiter].map(char => char.codePointAt())

  return source => new Observable(subscriber => {
    return source.subscribe({
      next(container) {
        try {
          while (true) {
            const match = findCodePointSequence(container, codePoints)
            if (!match)
              break

            const committed = includeDelimiter
              ? container.splitAt(match.end)
              : container.splitAt(match.begin)

            if (!includeDelimiter)
              container.popRangeAt(
                cursorAfter(container.begin(), codePoints.length)
              )

            subscriber.next(committed)
          }
        }
        catch (error) {
          subscriber.error(error)
        }
      },
      error(error) { subscriber.error(error) },
      complete() { subscriber.complete() },
    })
  })
}

export function decodeUnicode() {
  return source => source.pipe(
    mergeMap(container => container.toStrings())
  )
}

function cursorAfter(cursor, count) {
  for (let i = 0; i < count; i++)
    cursor.step()

  return cursor
}

function findCodePointSequence(range, sequence) {
  const cursor = range.begin()
  const end = range.end()

  while (!cursor.equals(end)) {
    const matchEnd = matchAt(cursor, end, sequence)
    if (matchEnd)
      return {
        begin: cursor.clone(),
        end: matchEnd,
      }

    cursor.step()
  }

  return null
}

function matchAt(cursor, end, sequence) {
  const current = cursor.clone()

  for (const codePoint of sequence) {
    if (current.equals(end))
      return null

    if (current.value != codePoint)
      return null

    current.step()
  }

  return current
}
