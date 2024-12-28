export default async function streamCloseAll(...streams) {
  const finishPromise = (stream) =>
    new Promise((resolve) => stream.end(resolve))
  await Promise.all(streams.map(finishPromise))
}