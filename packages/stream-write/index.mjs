
export async function streamWrite(
  stream, stringOrBuffer, { signal, encoding } = { }) {

  if (stream.write(stringOrBuffer, encoding)) {
    return
  } 
      
  return new Promise((resolve, reject) => {
    const onDrain = () => {
      try {
        if (!stream.write(stringOrBuffer, encoding)) {
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