import fs from 'node:fs'
import path from 'node:path'

import * as core from '@actions/core'
import axios from 'axios'

import type {
  ItemPublishResponseData,
  ItemResponseData,
  OAuth2TokenResponse,
  UnsuccessfulItemResponseData,
  UploadState
} from '@/types'

import type { AxiosResponse, RawAxiosRequestHeaders } from 'axios'
import { globSync } from 'glob'

// https://developer.chrome.com/docs/webstore/using_webstore_api/

export async function generateJwtToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  // https://developers.google.com/identity/protocols/oauth2/web-server#httprest_1
  core.info('Start to refresh access token.')
  const response = await axios.post<OAuth2TokenResponse>(
    'https://www.googleapis.com/oauth2/v4/token',
    {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }
  )

  const accessToken = response.data.access_token

  core.info('Access token refreshed.')

  return accessToken
}

export async function updatePackage(
  extId: string,
  zipPath: string,
  token: string
): Promise<boolean> {
  let url: string
  let headers: RawAxiosRequestHeaders
  let response: AxiosResponse<ItemResponseData>
  let uploadState: UploadState

  // https://developer.chrome.com/docs/webstore/using_webstore_api/#uploadexisitng
  // https://developer.chrome.com/docs/webstore/using_webstore_api/#checkstatus

  core.info('Start to update extension package.')

  url = `https://www.googleapis.com/upload/chromewebstore/v1.1/items/${extId}?uploadType=media`
  const body = fs.createReadStream(path.resolve(zipPath))
  headers = { 'Authorization': `Bearer ${token}`, 'x-goog-api-version': '2' }
  response = await axios.put<ItemResponseData>(url, body, {
    headers,
    maxContentLength: Number.POSITIVE_INFINITY
  })
  uploadState = response.data.uploadState

  core.debug(`Response status code: ${response.status}`)
  core.debug(JSON.stringify(response.data))

  // Wait until package uploaded.
  headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Length': '0',
    'Expect': '',
    'x-goog-api-version': '2'
  }
  url = `https://www.googleapis.com/chromewebstore/v1.1/items/${extId}?projection=DRAFT`
  while (uploadState === 'IN_PROGRESS') {
    core.info('Package is still uploading. Wait for 10 seconds.')
    await new Promise(res => setTimeout(res, 10000))

    response = await axios<ItemResponseData>(url, { headers })
    uploadState = response.data.uploadState
  }

  if (uploadState === 'SUCCESS') {
    core.info('Extension package updated.')
    return true
  }

  const errorResponse = response.data as UnsuccessfulItemResponseData
  core.error('Failed to update extension package.')
  for (const errMsg of errorResponse.itemError) {
    core.error(errMsg.error_detail)
  }
  return false
}

export async function publishExtension(
  extId: string,
  testerOnly: boolean,
  token: string
): Promise<boolean> {
  // https://developer.chrome.com/docs/webstore/using_webstore_api/#publishpublic
  // https://developer.chrome.com/docs/webstore/using_webstore_api/#trustedtesters
  core.info('Start to publish extension.')

  const url = `https://www.googleapis.com/chromewebstore/v1.1/items/${extId}/publish`
  const publishTarget = testerOnly ? 'trustedTesters' : 'default'
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Length': '0',
    'x-goog-api-version': '2'
  }
  const response = await axios.post<ItemPublishResponseData>(url, undefined, {
    headers,
    params: { publishTarget }
  })

  core.debug(`Response status code: ${response.status}`)
  core.debug(JSON.stringify(response.data))

  const status = response.data.status
  if (status.length === 1 && status[0] === 'OK') {
    core.info('Extension published.')
    return true
  }

  core.error(`Failed to publish extension: ${status.join(', ')}`)
  for (const msg of response.data.statusDetail) {
    core.error(msg)
  }
  return false
}

export function tryResolvePath(pattern: string): string {
  const foundFiles = globSync(pattern)

  if (foundFiles.length < 1) {
    throw new Error(`File not found: ${pattern}`)
  }
  if (foundFiles.length > 1) {
    throw new Error(`Multiple files found: ${pattern}`)
  }

  return foundFiles[0]
}
