
import { using, Observable } from 'rxjs';

export default function fromListener(listener, options = {}) {
  const { start, stop } = options;

  return using(
    () => {
      if (start) start();
      return {
        unsubscribe: () => {
          if (stop) stop();
        }
      };
    },
    () => new Observable((observer) => {
      listener.on('data', (data) => observer.next(data));
      listener.on('error', (error) => observer.error(error));
    })
  );
}
