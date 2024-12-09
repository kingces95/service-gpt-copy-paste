import { Observable, Subject } from 'rxjs';

export default function collateBy(keySelector) {
  return (source) => new Observable((subscriber) => {
    let currentKey = null;
    let currentSubject = null;

    const subscription = source.subscribe({
      next(value) {
        const key = keySelector(value);

        if (key !== currentKey) {
          // Complete the current subject if key changes
          if (currentSubject) {
            currentSubject.complete();
          }
          // Create a new subject for the new key
          currentSubject = new Subject();
          currentKey = key;

          // Emit the new subject as an observable
          subscriber.next(currentSubject.asObservable());
        }

        // Pass the value to the current subject
        if (currentSubject) {
          currentSubject.next(value);
        }
      },
      error(err) {
        if (currentSubject) {
          currentSubject.error(err);
        }
        subscriber.error(err);
      },
      complete() {
        if (currentSubject) {
          currentSubject.complete();
        }
        subscriber.complete();
      }
    });

    return () => subscription.unsubscribe();
  });
}
