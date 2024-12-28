import { jest } from '@jest/globals';
import { TestScheduler } from 'rxjs/testing';
import { Observable } from 'rxjs';
import { of } from 'rxjs';
import PollingOperation from './PollingOperation.mjs';

function fromStream(stream) {
  return new Observable((subscriber) => {
    const onData = (data) => subscriber.next(data);
    const onEnd = () => {
      subscriber.complete();
    }
    const onError = (err) => subscriber.error(err);

    stream.on('data', onData);
    stream.on('end', onEnd);
    stream.on('error', onError);

    // Cleanup function
    return () => {
      stream.off('data', onData);
      stream.off('end', onEnd);
      stream.off('error', onError);
    };
  });
}

async function syncOperation({ operation, out, err}) {
  await Promise.all([
    new Promise((resolve, reject) => {
      out.subscribe({
        error: resolve,
        complete: resolve,
      });
    }),
    new Promise((resolve, reject) => {
      err.subscribe({
        error: resolve,
        complete: resolve,
      });
    }),
    new Promise((resolve) => {
      operation.on('end', (result) => {
        resolve();
      });
    }),
  ]);
}

describe('PollingOperation', () => {
  let testScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should pass through the script on first successful read', () => {
    testScheduler.run(async ({ cold, expectObservable }) => {
      const signal = new AbortController();
      const testTimers = {
        interval: () => cold('---a---a---a|', { a: 0 }),
        timer: (ms) => cold(`${'-'.repeat(ms / 100)}|`),
      };

      const options = {
        pollMs: 200,
        retryMs: 300,
        maxRetryMs: 2000,
        retries: 3,
        test: (content) => content === 'target script',
        timers: testTimers,
        readFn: jest.fn(() => of('target script')),
      };

      const operation = PollingOperation.create(signal.signal, options);
      const out = fromStream(operation.out)
      const err = fromStream(operation.err);

      expect(operation.result).toEqual('target script');
      expectObservable(out).toBe('a|', {
        a: { event: 'poll', content: 'target script' },
      });
      expectObservable(err).toBe('|', { });

      await syncOperation({ operation, out, err });
    });
  });
});
