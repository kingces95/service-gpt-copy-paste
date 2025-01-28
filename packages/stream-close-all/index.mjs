export default async function streamCloseAll(...streams) {
  const validStreams = streams.filter((stream) => stream)

  const finishPromise = (stream) =>
    new Promise((resolve) => stream.end(resolve))

  await Promise.all(validStreams.map(finishPromise))
}
