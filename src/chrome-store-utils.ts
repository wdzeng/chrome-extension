import fs from 'node:fs'
import path from 'node:path'

import * as core from '@actions/core'
import axios from 'axios'

import type {
  FetchStatusResponseData,
  ItemPublishResponseData,
  OAuth2TokenResponse,
  UploadItemResponseData,
  UploadState
} from '@/types'

import type { AxiosResponse, RawAxiosRequestHeaders } from 'axios'
import { globSync } from 'glob'

// https://developer.chrome.com/docs/webstore/using-api

export async function generateJwtToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  // https://developers.google.com/identity/protocols/oauth2/web-server#httprest_1
  core.info('Start to refresh access token.')
  const response = await axios.post<OAuth2TokenResponse>(
    'https://oauth2.googleapis.com/token',
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  )

  const accessToken = response.data.access_token

  core.info('Access token refreshed.')

  return accessToken
}

export async function updatePackage(
  publisherId: string,
  extId: string,
  zipPath: string,
  token: string
): Promise<boolean> {
  let uploadState: UploadState
  let fetchStatusResponse: AxiosResponse<FetchStatusResponseData> | undefined

  // https://developer.chrome.com/docs/webstore/using-api#upload-a-package-to-update-an-existing-store-item
  // https://developer.chrome.com/docs/webstore/api/reference/rest/v2/media/upload
  // https://developer.chrome.com/docs/webstore/api/reference/rest/v2/publishers.items/fetchStatus

  core.info('Start to update extension package.')

  const itemName = `publishers/${publisherId}/items/${extId}`
  const url = `https://chromewebstore.googleapis.com/upload/v2/${itemName}:upload`
  const body = fs.createReadStream(path.resolve(zipPath))
  const headers: RawAxiosRequestHeaders = { 'Authorization': `Bearer ${token}` }
  const uploadResponse = await axios.post<UploadItemResponseData>(url, body, {
    headers,
    maxContentLength: Number.POSITIVE_INFINITY
  })
  uploadState = uploadResponse.data.uploadState

  core.debug(`Response status code: ${uploadResponse.status}`)
  core.debug(JSON.stringify(uploadResponse.data))

  // Wait until package uploaded.
  const statusUrl = `https://chromewebstore.googleapis.com/v2/${itemName}:fetchStatus`
  while (uploadState === 'IN_PROGRESS') {
    core.info('Package is still uploading. Wait for 10 seconds.')
    await new Promise(res => setTimeout(res, 10000))

    fetchStatusResponse = await axios.get<FetchStatusResponseData>(statusUrl, { headers })
    uploadState = fetchStatusResponse.data.lastAsyncUploadState ?? 'UPLOAD_STATE_UNSPECIFIED'
  }

  if (uploadState === 'SUCCEEDED') {
    core.info('Extension package updated.')
    return true
  }

  core.error('Failed to update extension package.')
  if (fetchStatusResponse) {
    const submittedState = fetchStatusResponse.data.submittedItemRevisionStatus?.state
    if (submittedState) {
      core.error(`Submitted revision state: ${submittedState}`)
    }
    if (fetchStatusResponse.data.takenDown) {
      core.error('The item is currently taken down. Check the Developer Dashboard for details.')
    }
    if (fetchStatusResponse.data.warned) {
      core.error('The item currently has an active warning in the Developer Dashboard.')
    }
  }
  core.error(`Upload state: ${uploadState}`)
  return false
}

export async function publishExtension(
  publisherId: string,
  extId: string,
  testerOnly: boolean,
  token: string
): Promise<boolean> {
  // https://developer.chrome.com/docs/webstore/using-api#publish-an-item
  // https://developer.chrome.com/docs/webstore/api/reference/rest/v2/publishers.items/publish
  core.info('Start to publish extension.')
  if (testerOnly) {
    core.warning(
      "The Chrome Web Store API v2 no longer supports selecting trusted testers via request parameter. The item will publish using its existing visibility settings from the Developer Dashboard."
    )
  }

  const itemName = `publishers/${publisherId}/items/${extId}`
  const url = `https://chromewebstore.googleapis.com/v2/${itemName}:publish`
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Length': '0'
  }
  const response = await axios.post<ItemPublishResponseData>(url, undefined, { headers })

  core.debug(`Response status code: ${response.status}`)
  core.debug(JSON.stringify(response.data))

  if (
    response.data.state === 'PENDING_REVIEW' ||
    response.data.state === 'PUBLISHED' ||
    response.data.state === 'PUBLISHED_TO_TESTERS' ||
    response.data.state === 'STAGED'
  ) {
    core.info(`Extension publish request accepted. Current state: ${response.data.state}.`)
    return true
  }

  core.error(`Failed to publish extension. Current state: ${response.data.state}`)
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
