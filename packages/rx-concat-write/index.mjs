import { concatMap } from 'rxjs/operators'
import { streamWrite } from '@kingjs/stream-write'

export default function concatWrite(stream) {
  return (source$) => source$.pipe(
    concatMap(async (data) => streamWrite(await stream, data))
  )
}