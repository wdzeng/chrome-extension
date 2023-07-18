
import fs from 'fs'
import path from 'path'
import * as core from '@actions/core'
import axios, { AxiosError, AxiosRequestHeaders, AxiosResponse } from 'axios'
import { ItemPublishResponseData, ItemResponseData, OAuth2TokenResponse, UploadState } from './types.js'

// https://developer.chrome.com/docs/webstore/using_webstore_api/

async function generateJwtToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  // https://developers.google.com/identity/protocols/oauth2/web-server#httprest_1
  core.info('Start to refresh access token.')
  const response: AxiosResponse<OAuth2TokenResponse> = await axios.post('https://oauth2.googleapis.com/token', {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  })

  const accessToken = response.data.access_token

  core.debug('Got access token: ' + accessToken)
  core.debug(JSON.stringify(response.data))
  core.info('Access token refreshed.')

  return accessToken
}

async function updatePackage(extId: string, zipPath: string, token: string): Promise<void> {
  let url: string
  let headers: AxiosRequestHeaders
  let response: AxiosResponse<ItemResponseData>
  let uploadState: UploadState

  // https://developer.chrome.com/docs/webstore/using_webstore_api/#uploadexisitng
  // https://developer.chrome.com/docs/webstore/using_webstore_api/#checkstatus

  core.info('Start to update extension package.')

  url = `https://www.googleapis.com/upload/chromewebstore/v1.1/items/${extId}?uploadType=media`
  const body = fs.createReadStream(path.resolve(zipPath))
  headers = { Authorization: `Bearer ${token}`, 'x-goog-api-version': '2' }
  response = await axios.put(url, body, { headers, maxContentLength: Infinity })
  uploadState = response.data.uploadState

  core.debug('Response status code: ' + response.status)
  core.debug(JSON.stringify(response.data))

  // Wait until package uploaded.
  headers = {
    Authorization: `Bearer ${token}`,
    'x-goog-api-version': '2',
    'Content-Length': '0',
    'Expect': ''
  }
  url = `https://www.googleapis.com/chromewebstore/v1.1/items/${extId}?projection=DRAFT`
  while (uploadState === 'IN_PROGRESS') {
    core.info('Package is still uploading. Wait for 10 seconds.')
    await new Promise(res => setTimeout(res, 10000))

    response = await axios(url, headers)
    uploadState = response.data.uploadState
  }

  if (uploadState === 'SUCCESS') {
    core.info('Extension package updated.')
    return
  }

  core.error('Failed to update extension package.')
  core.error(JSON.stringify(response.data))
  process.exit(1)
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
  const response: AxiosResponse<ItemPublishResponseData> = await axios.post(url, null, { headers, params: { target } })

  core.debug('Response status code: ' + response.status)
  core.debug(JSON.stringify(response.data))

  const status = response.data.status
  if (status.length === 1 && status[0] === 'OK') {
    core.info('Extension published.')
    return
  }

  core.error('Failed to publish extension: ' + status.join(', '))
  response.data.statusDetail.forEach(msg => core.error(msg))
  process.exit(1)
}

async function run(extensionId: string, zipPath: string, testerOnly: boolean, clientId: string, clientSecret: string, refreshToken: string): Promise<void> {
  core.info('Start to publish extension to Web Store.')

  const jwtToken = await generateJwtToken(clientId, clientSecret, refreshToken)
  await updatePackage(extensionId, zipPath, jwtToken)
  await publishExtension(extensionId, testerOnly, jwtToken)

  core.info('Extension published successfully.')
}

function handleError(error: unknown): void {
  core.debug(JSON.stringify(error))

  // HTTP error
  if (error instanceof AxiosError) {
    if (error.response) {
      // Got response from Web Store API server with status code 4XX or 5XX
      core.setFailed('Web Store API server responses with error code: ' + error.response.status)
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
