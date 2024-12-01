// Import dependencies
import deepmerge from 'deepmerge'

// Define the expressMetadataDeepmerge middleware function
function metadata(md) {
  return function (req, res, next) {
    try {
      req.metadata = deepmerge(req.metadata || {}, md)
      next()
    } catch (error) {
      next(error)
    }
  }
}

export default metadata;
