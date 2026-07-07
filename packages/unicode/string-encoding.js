import { Buffer } from 'node:buffer'

export class UnicodeEncoding {
  static from(encoding = 'utf-8') {
    if (encoding instanceof UnicodeEncoding)
      return encoding

    return new this(encoding)
  }

  static normalize(encoding = 'utf-8') {
    switch (encoding?.toLowerCase()) {
      case 'utf8':
      case 'utf-8':
        return 'utf-8'
      case 'utf16le':
      case 'utf-16le':
      case 'ucs2':
      case 'ucs-2':
        return 'utf-16le'
      case 'utf16be':
      case 'utf-16be':
        return 'utf-16be'
    }

    throw new Error('Unsupported Unicode encoding.')
  }

  _name

  constructor(encoding = 'utf-8') {
    this._name = this.constructor.normalize(encoding)
  }

  get name() { return this._name }

  get countByteWidth() {
    switch (this.name) {
      case 'utf-8':
        return 1
      case 'utf-16le':
      case 'utf-16be':
        return 2
    }
  }

  encodeString(value) {
    switch (this.name) {
      case 'utf-8':
        return new Uint8Array(Buffer.from(value, 'utf8'))
      case 'utf-16le':
        return new Uint8Array(Buffer.from(value, 'utf16le'))
      case 'utf-16be':
        return swapUint16Bytes(Buffer.from(value, 'utf16le'))
    }
  }

  decodeBytes(bytes) {
    return new TextDecoder(this.name).decode(bytes)
  }

  decodeChunk(bytes) {
    return new TextDecoder(this.name, { fatal: true })
      .decode(bytes, { stream: true })
  }

  decodeChunks(chunks) {
    const decoder = new TextDecoder(this.name)
    const result = []

    for (const chunk of chunks) {
      const decoded = decoder.decode(chunk, { stream: true })
      if (decoded)
        result.push(decoded)
    }

    const decoded = decoder.decode()
    if (decoded)
      result.push(decoded)

    return result.join('')
  }
}

function swapUint16Bytes(bytes) {
  const result = new Uint8Array(bytes.length)

  for (let i = 0; i < bytes.length; i += 2) {
    result[i] = bytes[i + 1]
    result[i + 1] = bytes[i]
  }

  return result
}
