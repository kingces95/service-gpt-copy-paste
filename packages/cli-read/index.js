import Utf8CharReader from '@kingjs/utf8-char-reader'
import { AbortError } from '@kingjs/abort-error'

const NEW_LINE_BYTE = 0x0A

export async function readByte(stream, signal) {
  // Attempt immediate read
  const chunk = stream.read(1)
  if (chunk) {
    return chunk[0]
  }

  return new Promise((resolve, reject) => {
    const onReadable = () => {
      try {
        const chunk = stream.read(1)
        if (!chunk) {
          stream.once('readable', onReadable)
          return 
        }
        cleanup()
        resolve(chunk[0])
      } catch(err) {
        try { cleanup() } 
        catch(err) { reject(err) }
        reject(err)
      }
    }

    const onEnd = () => {
      cleanup()
      resolve(null)
    }

    const onError = (err) => {
      cleanup()
      reject(err)
    }

    const onAbort = () => {
      cleanup()
      reject(new AbortError())
    }

    const cleanup = () => {
      stream.off('readable', onReadable)
      stream.off('end', onEnd)
      stream.off('error', onError)
      signal?.removeEventListener('abort', onAbort)
    }

    stream.once('readable', onReadable)
    stream.on('end', onEnd)
    stream.on('error', onError)
    signal?.addEventListener('abort', onAbort)
  })
}

export async function readChar(stream, signal) {
  return await readString(stream, signal, 1)
}

export async function readString(stream, signal, charCount) {
  const charReader = new Utf8CharReader()

  while (charReader.charCount < charCount) {
    const byte = await readByte(stream, signal)
    if (byte === null) break // Handle unexpected EOF
    charReader.processByte(byte)
  }

  return charReader.toString() // Convert the buffered bytes to a string
}

export async function read(stream, signal) {
  const charReader = new Utf8CharReader()

  while (true) {
    const byte = await readByte(stream, signal)
    if (byte === null || byte === NEW_LINE_BYTE) break // Stop at newline or EOF
    charReader.processByte(byte)
  }

  return charReader.toString() // Convert the buffered bytes to a string
}

export function* split$(line, count, ifs = ' ') {
  const regex = new RegExp(`([^${ifs}]+)[${ifs}]*`, 'g')
  let lastIndex = 0

  for (let i = 0; i < count - 1; i++) {
    const match = regex.exec(line)
    if (match) {
      yield match[1]
      lastIndex = regex.lastIndex
    } else {
      yield null
      return
    }
  }

  // Yield the rest of the line as the last field
  yield line.slice(lastIndex)
}

export async function readArray(stream, signal, ifs) {
  const line = await read(stream, signal)
  return splitArray(line, ifs)
}

export async function splitArray(line, ifs) {
  const iterator = split$(line, Infinity, ifs)
  return Array.from(iterator)
}

export async function readRecord(stream, signal, ifs, fields) {
  const line = await read(stream, signal)
  return splitRecord(line, ifs, fields)
}

export async function splitRecord(line, ifs, fields) {
  let record = { }

  if (Array.isArray(fields)) {
    const iterator = split$(line, fields.length, ifs)
    fields.forEach((field, index) => {
      record[field] = iterator.next().value
    })
  } else if (typeof fields === 'object') {
    const fieldNames = Object.keys(fields)
    const iterator = split$(line, fieldNames.length, ifs)

    fieldNames.forEach((field, index) => {
      const value = iterator.next().value
      if (value === undefined || value === null) 
        return

      var type = fields[field]
      if (type == '#') type = 'number'
      if (type == '!') type = 'boolean'

      if (type === 'number') {
        record[field] = Number(value)

      } else if (type === 'boolean') {
        record[field] = !(
          value === '' 
          || value === 'false' 
          || value === 'False' 
          || value === '0')
      } else {
        record[field] = value
      }
    })
  }

  return record
}
