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

export function writeBuffer$(stream, signal, buffer, encoding) {
  if (stream.write(buffer, encoding)) {
    return
  } 
      
  return new Promise((resolve, reject) => {
    const onDrain = () => {
      try {
        if (!stream.write(buffer, encoding)) {
          stream.once('drain', onDrain)
          return
        } 
        cleanup()
        resolve() // Write succeeded
      } catch (err) {
        try { cleanup() } 
        catch(err) { reject(err) }
        reject(err)
      }
    }

    const onError = (err) => {
      cleanup()
      reject(err)
    }

    const onEnd = () => {
      cleanup()
      reject(new Error('Stream ended before write completed'))
    }

    const onAbort = () => {
      cleanup()
      reject(new Error('Aborted'))
    }

    const cleanup = () => {
      stream.off('drain', onDrain)
      stream.off('end', onEnd)
      stream.off('error', onError)
      signal?.removeEventListener('abort', onAbort)
    }

    stream.once('drain', onDrain)
    stream.on('end', onEnd)
    stream.on('error', onError)
    signal?.addEventListener('abort', onAbort)
  })
}