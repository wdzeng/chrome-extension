import fs from 'node:fs'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

import * as core from '@actions/core'
import axios from 'axios'

import type { AxiosResponse } from 'axios'

import type {
  FetchStatusResponseData,
  ItemPublishResponseData,
  UploadItemResponseData,
  UploadState
} from '#/chrome-web-store/types'

// https://developer.chrome.com/docs/webstore/using-api

export async function uploadExtension(
  publisherId: string,
  extId: string,
  zipPath: string,
  token: string
): Promise<void> {
  // https://developer.chrome.com/docs/webstore/using-api#uploadexisting
  // https://developer.chrome.com/docs/webstore/api/reference/rest/v2/media/upload

  core.info('Start to upload extension package.')

  const uploadUrl = `https://chromewebstore.googleapis.com/upload/v2/publishers/${publisherId}/items/${extId}:upload`
  const body = fs.createReadStream(path.resolve(zipPath))
  const headers = { Authorization: `Bearer ${token}` }
  const uploadResponse = await axios.post<UploadItemResponseData>(uploadUrl, body, {
    headers,
    maxContentLength: Number.POSITIVE_INFINITY
  })

  core.debug(`Response status code: ${uploadResponse.status}`)
  core.debug(JSON.stringify(uploadResponse.data))

  const uploadState: UploadState = uploadResponse.data.uploadState
  await waitUntilExtensionUploaded(publisherId, extId, token, uploadState)
}

async function waitUntilExtensionUploaded(
  publisherId: string,
  extId: string,
  token: string,
  initialUploadState: UploadState
): Promise<void> {
  // https://developer.chrome.com/docs/webstore/api/reference/rest/v2/publishers.items/fetchStatus

  let uploadState: UploadState = initialUploadState

  const fetchStatusUrl = `https://chromewebstore.googleapis.com/v2/publishers/${publisherId}/items/${extId}:fetchStatus`
  const headers = { Authorization: `Bearer ${token}` }
  let fetchStatusResponse: AxiosResponse<FetchStatusResponseData> | undefined
  while (uploadState === 'IN_PROGRESS') {
    core.info('Package is still uploading. Wait for 10 seconds.')
    await delay(10000) // 10s
    fetchStatusResponse = await axios.get<FetchStatusResponseData>(fetchStatusUrl, { headers })
    uploadState = fetchStatusResponse.data.lastAsyncUploadState ?? 'UPLOAD_STATE_UNSPECIFIED'
  }

  if (uploadState === 'SUCCEEDED') {
    core.info('Extension package uploaded.')
    return
  }

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

  switch (uploadState) {
    case 'FAILED':
      throw new Error('Extension package upload failed.')
    case 'NOT_FOUND':
      throw new Error('Extension not found. Check the item ID and try again.')
    default:
      throw new Error('Unexpected upload state: ${uploadState}')
  }
}

export async function publishExtension(
  publisherId: string,
  extId: string,
  token: string
): Promise<void> {
  // https://developer.chrome.com/docs/webstore/using-api#publish-an-item
  // https://developer.chrome.com/docs/webstore/api/reference/rest/v2/publishers.items/publish

  core.info('Start to publish extension.')

  const url = `https://chromewebstore.googleapis.com/v2/publishers/${publisherId}/items/${extId}:publish`
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Length': '0'
  }
  const response = await axios.post<ItemPublishResponseData>(url, undefined, { headers })

  core.debug(`Response status code: ${response.status}`)
  core.debug(JSON.stringify(response.data))

  switch (response.data.state) {
    case 'PENDING_REVIEW':
      core.info('Extension is pending review. It will be published after review passed.')
      return
    case 'PUBLISHED':
      core.info('Extension is published to all users.')
      return
    case 'PUBLISHED_TO_TESTERS':
      core.info('Extension is published to testers.')
      return
    case 'STAGED':
      core.info('Extension has been approved and is ready to be published.')
      return
    case 'REJECTED':
      throw new Error('Extension is rejected. Check the Developer Dashboard for details.')
    case 'CANCELLED':
      throw new Error(
        'Extension submission is cancelled. Check the Developer Dashboard for details.'
      )
    default:
      throw new Error(`Unexpected extension state: ${response.data.state}`)
  }
}
