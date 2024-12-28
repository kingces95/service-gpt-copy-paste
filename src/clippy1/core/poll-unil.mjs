import { interval } from 'rxjs'
import { switchMap, filter, first } from 'rxjs/operators'

const POLL_MS = 200

export default function pollUntil({ fetch, test, next, complete, error, intervalMs = POLL_MS }) {
  interval(intervalMs).pipe(
    switchMap(() => fetch()),
    filter(test),
    first()
  ).subscribe({ next, complete, error })
}