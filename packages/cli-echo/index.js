function writeBuffer$(stream, signal, buffer, encoding) {
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

export function write(stream, signal, line, encoding = 'utf8') {
  const buffer = Buffer.from(line + '\n', encoding) // Convert to buffer with specified encoding
  return writeBuffer$(stream, signal, buffer, encoding)
}

export function writeRecord(stream, signal, ifs, values, encoding = 'utf8') {
  const record = values.join(ifs[0])
  return write(stream, signal, record, encoding) // Use write to append a newline
}
