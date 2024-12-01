// Experiment with attaching metadata to middleware functions
import express from 'express'
import invoke from '@kingjs/express-invoke'
import metadata from '@kingjs/express-metadata-deepmerge'
import sendResult from '@kingjs/express-send-result'
import sendError from '@kingjs/express-send-error'
import ExpressError from '@kingjs/express-error'

// Define OAuthTokenOperations class
class OAuthTokenOperations {
  constructor(router) {
    this.router = router
    // Setup only the callback route
    router.get('/callback', invoke(this.callback.bind(this)))
  }

  async callback({ query }) {
    return { success: true, message: 'Callback handled', query }
  }
}

// Define OAuthProviderOperations class
class OAuthProviderOperations {
  constructor(router) {
    this.router = router
    // Setup additional routes if necessary
  }
}

// Spin up webserver using the above tools
const app = express()
const apiRouter = express.Router()
const oauthRouter = express.Router()
const oauthTokenRouter = express.Router()
const oauthProviderRouter = express.Router()

app.use('/api', apiRouter)
apiRouter.use('/oauth', oauthRouter)
oauthRouter.use('/token', oauthTokenRouter)
oauthRouter.use('/provider', oauthProviderRouter)

// Register OAuth operations on routers
const oauthTokenOperations = new OAuthTokenOperations(oauthTokenRouter)
const oauthProviderOperations = new OAuthProviderOperations(oauthProviderRouter)

// Attach the route to the API router
apiRouter.get('/myRoute', invoke(() => {
  throw new ExpressError(404, 'Bad news!')
  return { value: 42 }
}))

// Install global middleware for handling res.result or errors
app.use(sendResult())

// Install global middleware for handling ExpressError
app.use(sendError({
  format: e => ({ error: true, message: e.message })
}))

// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
