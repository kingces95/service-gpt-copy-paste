// Import required modules
import express from 'express'
import axios from 'axios'
import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import { v4 as uuidv4 } from 'uuid'
import open from 'open'

// Constants
const PORT = 5000
const BASE_SEGMENTS = '/oauth'
const CALLBACK_URI = `http://localhost:${PORT}${BASE_SEGMENTS}/callback`
const RESPONSE_TYPE = 'code'
const ACCESS_TYPE = 'offline'
const TOKENS = 'tokens'
const CLIENTS = 'clients'
const TOKEN_DB_FILE = `${TOKENS}.json`
const CLIENT_DB_FILE = `${CLIENTS}.json`
const REGISTER_ENDPOINT = `${BASE_SEGMENTS}/register`
const INITIATE_ENDPOINT = `${BASE_SEGMENTS}/initiate`
const CALLBACK_ENDPOINT = `${BASE_SEGMENTS}/callback`
const TOKEN_ENDPOINT = `${BASE_SEGMENTS}/token`
const TOKENS_LIST_ENDPOINT = `${BASE_SEGMENTS}/tokens`
const LOGOUT_ENDPOINT = `${BASE_SEGMENTS}/logout`
const REFRESH_ENDPOINT = `${BASE_SEGMENTS}/refresh`
const REGISTRATIONS_ENDPOINT = `${BASE_SEGMENTS}/registrations`
const DEFAULT_SCOPE_DELIMITER = ' '
const DEFAULT_OAUTH_VERSION = '2.0'
const GRANT_TYPE = {
  AUTHORIZATION_CODE: 'authorization_code',
  REFRESH_TOKEN: 'refresh_token'
}

// Enum for token status
const TOKEN_STATUS = {
  PENDING: 'pending',
  AUTHORIZED: 'authorized'
}

// Enum for HTTP response codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
}

// Set up databases
const tokenAdapter = new FileSync(TOKEN_DB_FILE)
const db = low(tokenAdapter)
db.defaults({ [TOKENS]: [] }).write()

const clientAdapter = new FileSync(CLIENT_DB_FILE)
const clientDb = low(clientAdapter)
clientDb.defaults({ [CLIENTS]: [] }).write()

// Create express app
const app = express()
app.use(express.json())

// Utility function to generate OAuth URL
function generateAuthUrl({ provider, scopes }) {
  const client = clientDb.get(CLIENTS).find({ name: provider }).value()
  if (!client)
    throw new Error('Provider not registered')

  const scopeString = scopes.join(client.scopeDelimiter)
  const state = uuidv4()
  
  // Build the OAuth URL using a map and join approach
  const params = {
    client_id: client.clientId,
    redirect_uri: CALLBACK_URI,
    scope: scopeString,
    response_type: RESPONSE_TYPE,
    access_type: ACCESS_TYPE,
    state: state
  }

  const urlParams = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')

  const url = `${client.authUrl}?${urlParams}`

  return { url, state }
}

// Endpoint to register a new provider
app.post(REGISTER_ENDPOINT, (req, res) => {
  const {
    name, authUrl, tokenUrl, clientId, clientSecret, 
    scopeDelimiter = DEFAULT_SCOPE_DELIMITER, 
    oauthVersion = DEFAULT_OAUTH_VERSION
  } = req.body

  // Save provider details
  clientDb.get(CLIENTS)
    .push({ name, authUrl, tokenUrl, clientId, clientSecret, scopeDelimiter, oauthVersion })
    .write()

  res.status(HTTP_STATUS.OK).send('Provider registered successfully')
})

// Endpoint to generate an OAuth authorization URL
app.post(INITIATE_ENDPOINT, (req, res) => {
  const { provider, scopes } = req.body
  try {
    const { url, state } = generateAuthUrl({ provider, scopes })

    // Save state to track the request
    db.get(TOKENS)
      .push({ provider, state, status: TOKEN_STATUS.PENDING, scopes })
      .write()

    res.status(HTTP_STATUS.OK).json({ url })
    open(url)
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).send(error.message)
  }
})

// Callback endpoint to handle OAuth response
app.get(CALLBACK_ENDPOINT, async (req, res) => {
  const { code, state } = req.query
  const tokenEntry = db.get(TOKENS).find({ state }).value()

  if (!tokenEntry)
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Invalid state')

  const client = clientDb.get(CLIENTS).find({ name: tokenEntry.provider }).value()

  if (!client)
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Provider not registered')

  try {
    const response = await axios.post(client.tokenUrl, {
      client_id: client.clientId,
      client_secret: client.clientSecret,
      code,
      redirect_uri: CALLBACK_URI,
      grant_type: GRANT_TYPE.AUTHORIZATION_CODE
    })

    const issuedAt = new Date().toISOString()
    const expiresIn = response.data.expires_in || null

    db.get(TOKENS)
      .find({ state })
      .assign({
        status: TOKEN_STATUS.AUTHORIZED,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || null,
        expiresIn: expiresIn,
        issuedAt: issuedAt
      })
      .write()

    res.status(HTTP_STATUS.OK).send('Authorization successful! You may close this window.')
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error exchanging code for tokens')
  }
})

// Endpoint to poll for token, filtering by provider and state
app.get(TOKEN_ENDPOINT, (req, res) => {
  const { provider, status } = req.query
  const query = { provider }
  if (status) query.status = status

  const tokenEntry = db.get(TOKENS).find(query).value()

  if (!tokenEntry)
    return res.status(HTTP_STATUS.NOT_FOUND).send('Token not found')

  res.status(HTTP_STATUS.OK).json({ accessToken: tokenEntry.accessToken })
})

// Endpoint to list all tokens and their details
app.get(TOKENS_LIST_ENDPOINT, (req, res) => {
  const { provider } = req.query
  let tokensQuery = db.get(TOKENS)

  if (provider)
    tokensQuery = tokensQuery.filter({ provider })

  const tokens = tokensQuery
    .map(({ provider, scopes, status, expiresIn, issuedAt }) => ({ provider, scopes, status, expiresIn, issuedAt }))
    .value()
  res.status(HTTP_STATUS.OK).json(tokens)
})

// Endpoint to list all registered providers
app.get(REGISTRATIONS_ENDPOINT, (req, res) => {
  const clients = clientDb.get(CLIENTS)
    .map(({ name, authUrl, tokenUrl, scopes }) => ({ name, authUrl, tokenUrl, scopes }))
    .value()
  res.status(HTTP_STATUS.OK).json(clients)
})

// Endpoint to refresh token
app.post(REFRESH_ENDPOINT, async (req, res) => {
  const { provider } = req.body

  const client = clientDb.get(CLIENTS).find({ name: provider }).value()
  if (!client)
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Provider not registered')
  
  const tokenEntry = db.get(TOKENS).find({ provider, status: TOKEN_STATUS.AUTHORIZED }).value()
  if (!tokenEntry || !tokenEntry.refreshToken)
    return res.status(HTTP_STATUS.NOT_FOUND).send('Refresh token not found')

  try {
    const response = await axios.post(client.tokenUrl, {
      client_id: client.clientId,
      client_secret: client.clientSecret,
      refresh_token: tokenEntry.refreshToken,
      grant_type: GRANT_TYPE.REFRESH_TOKEN
    })

    const issuedAt = new Date().toISOString()
    const expiresIn = response.data.expires_in || null

    db.get(TOKENS)
      .find({ provider })
      .assign({
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || tokenEntry.refreshToken,
        expiresIn: expiresIn,
        issuedAt: issuedAt
      })
      .write()

    res.status(HTTP_STATUS.OK).send('Token refreshed successfully')
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error refreshing token')
  }
})

// Endpoint to logout and delete a token
app.post(LOGOUT_ENDPOINT, (req, res) => {
  const { provider } = req.body
  const tokenEntry = db.get(TOKENS).find({ provider }).value()

  if (!tokenEntry)
    return res.status(HTTP_STATUS.NOT_FOUND).send('Token not found')

  db.get(TOKENS).remove({ provider }).write()
  res.status(HTTP_STATUS.OK).send('Logged out successfully')
})

// Start server
app.listen(PORT, () => {
  console.log(
    `OAuth token service running on http://localhost:${PORT}`
  )
})
