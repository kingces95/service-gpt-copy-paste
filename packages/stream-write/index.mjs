export default function streamWrite(stream, data) {
  return new Promise((resolve, reject) => {
    function attemptWrite() {
      try {
        if (!stream.write(data)) {
          // Wait for the drain event if write returns false
          stream.once('drain', attemptWrite);
        } else {
          // Resolve when the write succeeds
          resolve();
        }
      } catch (err) {
        // Reject on errors
        reject(err);
      }
    }

    attemptWrite(); // Start the write process
  });
}
