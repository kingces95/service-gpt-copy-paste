// Middleware to send the result or proceed with the next middleware
export default function sendResult() {
  return (req, res, next) => {
    if (res.result !== undefined) {
      return res.status(200).send(res.result) // Send the result as a JSON response
    }
    next() // Continue to the next middleware if no result is set
  }
}
