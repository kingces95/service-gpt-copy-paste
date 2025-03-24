import { streamWrite } from '@kingjs/stream-write'

export async function write(stream, signal, line, encoding = 'utf8') {
  const options = { signal, encoding }
  await streamWrite(stream, Buffer.from(line, encoding), options)
  await streamWrite(stream, Buffer.from('\n', encoding), options)
}

export function joinFields(ifs, values) {
  return values.join(ifs[0])
}

export async function writeRecord(stream, signal, ifs, values, encoding = 'utf8') {
  const record = joinFields(ifs, values)
  return write(stream, signal, record, encoding) // Use write to append a newline
}
