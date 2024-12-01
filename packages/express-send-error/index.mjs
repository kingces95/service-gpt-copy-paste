import ExpressError from '@kingjs/express-error'

// Middleware to send the error or proceed with the next middleware
export default function sendError(options = {}) {
  const { format = (o) => o } = options; // Default value for 'format' is identity function
  return (error, req, res, next) => {
    if (error instanceof ExpressError) {
      const formattedError = format(error);
      return res.status(error.code).json(formattedError);
    }
    next(); // Continue to the next middleware if no result is set
  };
}
