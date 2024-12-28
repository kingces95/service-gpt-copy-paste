import { Observable } from 'rxjs'
import fromStream from '@kingjs/rx-from-stream'

/**
 * Creates an observable from a spawn-like controller with streams.
 *
 * @param {EventEmitter} controller - The main controller (e.g., returned from spawn).
 * @returns {Object} An object containing observables for controller, out, and error.
 */
export default function fromSpawn(controller) {
  return {
    controller: new Observable((subscriber) => {
      const onError = (error) => subscriber.error(error)
      const onEnd = (data) => subscriber.next(data)
      const onClose = () => subscriber.complete()

      controller.on('error', onError)
      controller.on('end', onEnd)
      controller.on('close', onClose)

      return () => {
        controller.off('error', onError)
        controller.off('end', onEnd)
        controller.off('close', onClose)
      }
    }),
    out: fromStream(controller.stdout),
    error: fromStream(controller.stderr)
  }
}
