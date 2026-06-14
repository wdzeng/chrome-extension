import fs from 'node:fs'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

import * as core from '@actions/core'

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

  core.info('Uploading extension.')

  const uploadUrl = `https://chromewebstore.googleapis.com/upload/v2/publishers/${publisherId}/items/${extId}:upload`
  const body = fs.createReadStream(path.resolve(zipPath))

  // use fetch
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/zip' },
    body,
    duplex: 'half' // required for streaming
  })
  if (!uploadResponse.ok) {
    const responseText = await uploadResponse.text()
    core.error(responseText)
    throw new Error(
      `Error uploading the extension package. HTTP status code: ${uploadResponse.status}`
    )
  }

  const uploadResponseData = (await uploadResponse.json()) as UploadItemResponseData
  await waitUntilExtensionUploaded(publisherId, extId, token, uploadResponseData.uploadState)
}

async function waitUntilExtensionUploaded(
  publisherId: string,
  extId: string,
  token: string,
  initialUploadState: UploadState
): Promise<void> {
  // https://developer.chrome.com/docs/webstore/api/reference/rest/v2/publishers.items/fetchStatus

  const fetchStatusUrl = `https://chromewebstore.googleapis.com/v2/publishers/${publisherId}/items/${extId}:fetchStatus`
  const headers = { Authorization: `Bearer ${token}` }
  let fetchStatusResponseData: FetchStatusResponseData | undefined
  let uploadState: UploadState = initialUploadState

  while (uploadState === 'IN_PROGRESS') {
    core.info('Package is still uploading. Wait for 10 seconds.')
    await delay(10000) // 10s
    const response = await fetch(fetchStatusUrl, { headers })
    if (!response.ok) {
      const responseText = await response.text()
      core.error(responseText)
      throw new Error(
        `Error fetching the extension upload status. HTTP status code: ${response.status}`
      )
    }
    fetchStatusResponseData = (await response.json()) as FetchStatusResponseData
    uploadState = fetchStatusResponseData.lastAsyncUploadState ?? 'UPLOAD_STATE_UNSPECIFIED'
  }

  if (uploadState === 'SUCCEEDED') {
    core.info('Extension uploaded.')
    return
  }

  if (fetchStatusResponseData) {
    const submittedState = fetchStatusResponseData.submittedItemRevisionStatus?.state
    if (submittedState) {
      core.error(`Submitted revision state: ${submittedState}`)
    }
    if (fetchStatusResponseData.takenDown) {
      core.error('The item is currently taken down. Check the Developer Dashboard for details.')
    }
    if (fetchStatusResponseData.warned) {
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

  core.info('Publishing extension.')

  const url = `https://chromewebstore.googleapis.com/v2/publishers/${publisherId}/items/${extId}:publish`
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Length': '0'
  }
  const response = await fetch(url, { method: 'POST', headers })
  if (!response.ok) {
    const responseText = await response.text()
    core.error(responseText)
    throw new Error(`Error publishing the extension. HTTP status code: ${response.status}`)
  }

  const responseData = (await response.json()) as ItemPublishResponseData
  switch (responseData.state) {
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
      throw new Error(`Unexpected extension state: ${responseData.state}`)
  }
}
