import * as core from '@actions/core'
import axios, { AxiosError } from 'axios'
import fs from 'fs/promises'
import path from 'path'

// https://developer.chrome.com/docs/webstore/using_webstore_api/

async function generateJwtToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  // https://developers.google.com/identity/protocols/oauth2/web-server#httprest_1
  core.info('Start to refresh access token.')
  const response = await axios.post('https://oauth2.googleapis.com/token', {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  })

  const accessToken = response.data.access_token
  core.info('Access token refreshed.')
  core.debug('Access token: ' + accessToken)
  return accessToken
}

async function updateExtension(extId: string, zipPath: string, token: string): Promise<void> {
  // https://developer.chrome.com/docs/webstore/using_webstore_api/#uploadexisitng
  core.info('Start to update extension package.')

  const url = `https://www.googleapis.com/upload/chromewebstore/v1.1/items/${extId}?uploadType=media`
  const body = await fs.readFile(path.resolve(zipPath), { encoding: 'binary' })
  const headers = { Authorization: `Bearer ${token}`, 'x-goog-api-version': '2' }
  const response = await axios.put(url, body, { headers, maxContentLength: Infinity })

  core.debug('Response status code: ' + response.status)
  core.debug(JSON.stringify(response.headers))
  core.debug(JSON.stringify(response.data))

  core.info('Extension package updated.')
}

async function publishExtension(extId: string, testerOnly: boolean, token: string): Promise<void> {
  // https://developer.chrome.com/docs/webstore/using_webstore_api/#publishpublic
  // https://developer.chrome.com/docs/webstore/using_webstore_api/#trustedtesters
  core.info('Start to publish extension.')

  const url = `https://www.googleapis.com/chromewebstore/v1.1/items/${extId}/publish`
  const target = testerOnly ? 'trustedTesters' : 'default'
  const headers = {
    Authorization: `Bearer ${token}`,
    'x-goog-api-version': '2',
    'Content-Length': '0'
  }
  await axios.post(url, null, { headers, params: { target } })

  core.info('Extension published.')
}

async function run(extensionId: string, zipPath: string, testerOnly: boolean, clientId: string, clientSecret: string, refreshToken: string): Promise<void> {
  core.info('Start to publish extension to Web Store.')

  const jwtToken = await generateJwtToken(clientId, clientSecret, refreshToken)
  await updateExtension(extensionId, zipPath, jwtToken)
  await publishExtension(extensionId, testerOnly, jwtToken)

  core.info('Extension published successfully.')
}

function handleError(error: unknown): void {
  core.debug(JSON.stringify(error))

  // HTTP error
  if (error instanceof AxiosError) {
    if (error.response) {
      // Got response from Firefox API server with status code 4XX or 5XX
      core.setFailed('Firefox API server responses with error code: ' + error.response.status)
      core.setFailed(error.response.data)
    }
    core.setFailed(error.message)
    return
  }

  // Unknown error
  if (error instanceof Error) {
    core.setFailed('Unknown error occurred.')
    core.setFailed(error)
    return
  }

  // Unknown error type
  core.setFailed('Unknown error occurred.')
}

async function main(): Promise<void> {
  const extensionId = core.getInput('extension-id', { required: true })
  const zipPath = core.getInput('zip-path', { required: true })
  const testerOnly = core.getBooleanInput('tester-only')
  const clientId = core.getInput('client-id', { required: true })
  const clientSecret = core.getInput('client-secret', { required: true })
  const refreshToken = core.getInput('refresh-token', { required: true })

  core.debug('Extension ID: ' + extensionId)
  core.debug('Zip file path: ' + zipPath)
  core.debug('Publish to testers only: ' + testerOnly)
  core.debug('Client ID: ' + clientId)
  core.debug('Client secret: ' + clientSecret)
  core.debug('Refresh token: ' + refreshToken)

  try {
    await run(extensionId, zipPath, testerOnly, clientId, clientSecret, refreshToken)
  } catch (e: unknown) {
    handleError(e)
  }
}

main()
