export default function streamWrite(stream, data) {
  return new Promise((resolve, reject) => {
    try {
      if (!stream.write(data)) {
        stream.once('drain', resolve)
      } else {
        resolve()
      }
    } catch (err) {
      reject(err)
    }
  })
}