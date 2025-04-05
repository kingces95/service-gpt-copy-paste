// async-emitter.mjs
import { EventEmitter } from 'events';

export class AsyncEmitter extends EventEmitter {
  async emitAsync(name, ...args) {
    const listeners = this.listeners(name);
    const results = await Promise.allSettled(
      listeners.map(listener =>
        Promise.resolve().then(() => listener(...args))
      )
    );

    const errors = results
      .filter(outcome => outcome.status === 'rejected')
      .map(outcome => outcome.reason);

    if (errors.length) {
      const failure = new AggregateError(
        errors,
        `One or more listeners for "${name}" failed`
      );
      this.emit('error', failure);
      throw failure;
    }

    return results.map(outcome =>
      outcome.status === 'fulfilled' ? outcome.value : undefined
    );
  }
}