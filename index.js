
import EventEmitter from 'events';
import clipboardy from 'clipboardy';
import { using, Observable } from 'rxjs';

class Listener extends EventEmitter {
  constructor(predicate) {
    super();
    this.predicate = predicate;
    this.isPolling = false;
    this.pollInterval = null;
  }

  start() {
    if (this.isPolling) return;
    this.isPolling = true;
    this.pollInterval = setInterval(async () => {
      try {
        const data = await clipboardy.read();
        if (this.predicate(data)) {
          this.emit('data', data);
        }
      } catch (error) {
        this.emit('error', error);
      }
    }, 200);
  }

  stop() {
    if (!this.isPolling) return;
    this.isPolling = false;
    clearInterval(this.pollInterval);
    this.pollInterval = null;
  }
}

function fromListener(listener, options = {}) {
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

export { Listener, fromListener };
