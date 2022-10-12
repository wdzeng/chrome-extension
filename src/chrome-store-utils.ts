import fs from 'node:fs'
import path from 'node:path'

import * as core from '@actions/core'
import axios, { AxiosRequestHeaders, AxiosResponse } from 'axios'

import {
  ItemPublishResponseData,
  ItemResponseData,
  OAuth2TokenResponse,
  UploadState,
} from './types.js'

// https://developer.chrome.com/docs/webstore/using_webstore_api/

export async function generateJwtToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  // https://developers.google.com/identity/protocols/oauth2/web-server#httprest_1
  core.info('Start to refresh access token.')
  const response: AxiosResponse<OAuth2TokenResponse> = await axios.post(
    'https://www.googleapis.com/oauth2/v4/token',
    {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }
  )

  const accessToken = response.data.access_token

  core.debug('Got access token: ' + accessToken)
  core.debug(JSON.stringify(response.data))
  core.info('Access token refreshed.')

  return accessToken
}

export async function updatePackage(
  extId: string,
  zipPath: string,
  token: string
): Promise<void> {
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
  response = await axios.put(url, body, {
    headers,
    maxContentLength: Infinity,
  })
  uploadState = response.data.uploadState

  core.debug('Response status code: ' + response.status)
  core.debug(JSON.stringify(response.data))

  // Wait until package uploaded.
  headers = {
    Authorization: `Bearer ${token}`,
    'x-goog-api-version': '2',
    'Content-Length': '0',
    Expect: '',
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

export async function publishExtension(
  extId: string,
  testerOnly: boolean,
  token: string
): Promise<void> {
  // https://developer.chrome.com/docs/webstore/using_webstore_api/#publishpublic
  // https://developer.chrome.com/docs/webstore/using_webstore_api/#trustedtesters
  core.info('Start to publish extension.')

  const url = `https://www.googleapis.com/chromewebstore/v1.1/items/${extId}/publish`
  const target = testerOnly ? 'trustedTesters' : 'default'
  const headers = {
    Authorization: `Bearer ${token}`,
    'x-goog-api-version': '2',
    'Content-Length': '0',
  }
  const response: AxiosResponse<ItemPublishResponseData> = await axios.post(
    url,
    null,
    { headers, params: { target } }
  )

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
