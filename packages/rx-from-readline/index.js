import { Observable } from 'rxjs';

function fromReadline(readline, options = {}) {
  if (typeof readline[Symbol.asyncIterator] === 'function') {
    // Cold Observable for promise-based readline
    return new Observable((subscriber) => {
      (async () => {
        try {
          for await (const line of readline) {
            subscriber.next(line); // Emit each line
          }
          subscriber.complete(); // Signal completion
        } catch (err) {
          subscriber.error(err); // Signal error
        } finally {
          readline.close(); // Ensure the interface is closed
        }
      })();

      // Cleanup function
      return () => readline.close();
    });
  } else {
    // Hot Observable for event-based readline
    return new Observable((subscriber) => {
      const onLine = (line) => subscriber.next(line); // Emit each line
      const onClose = () => subscriber.complete(); // Signal completion
      const onError = (err) => subscriber.error(err); // Signal error

      readline.on('line', onLine);
      readline.on('close', onClose);
      readline.on('error', onError);

      // Cleanup function
      return () => {
        readline.off('line', onLine);
        readline.off('close', onClose);
        readline.off('error', onError);
        readline.close();
      };
    });
  }
}

export { fromReadline };
