// Invoke middleware function for mapping req/res to a normal function invocation
export default function invoke(operation) {
  return async (req, res, next) => {
    try {
      // Call the operation with req as context and pass req and res
      res.result = await operation(req, res)
      next()
    } catch (error) {
      next(error) // Pass the error to the next middleware for handling
    }
  }
}
