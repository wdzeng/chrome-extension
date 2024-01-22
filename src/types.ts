// https://developer.chrome.com/docs/webstore/using_webstore_api/#test-oauth
// https://developers.google.com/identity/protocols/oauth2/web-server#httprest_3
export interface OAuth2TokenResponse {
  access_token: string
  expires_in: number
  refresh_token: string
  scope: string
  token_type: 'Bearer'
}

// https://developer.chrome.com/docs/webstore/webstore_api/items/
export type UploadState = 'FAILURE' | 'IN_PROGRESS' | 'NOT_FOUND' | 'SUCCESS'

export interface SuccessfulItemResponseData {
  id: string
  kind: 'chromewebstore#item'
  publicKey: string
  uploadState: 'SUCCESS'
}

// The Chrome Web store returns a 200 response even if the upload fails.
export interface UnsuccessfulItemResponseData {
  id: string
  itemError: {
    error_code: string // Includes `ITEM_NOT_UPDATABLE`; not sure what other values are possible.
    error_detail: string // Human readable error message.
  }[]
  kind: 'chromewebstore#item'
  uploadState: 'FAILURE' | 'IN_PROGRESS' | 'NOT_FOUND'
}

// https://developer.chrome.com/docs/webstore/webstore_api/items/
export type ItemResponseData = SuccessfulItemResponseData | UnsuccessfulItemResponseData

// https://developer.chrome.com/docs/webstore/webstore_api/items/publish/
export type PublishStatus =
  | 'OK'
  | 'NOT_AUTHORIZED'
  | 'INVALID_DEVELOPER'
  | 'DEVELOPER_NO_OWNERSHIP'
  | 'DEVELOPER_SUSPENDED'
  | 'ITEM_NOT_FOUND'
  | 'ITEM_PENDING_REVIEW'
  | 'ITEM_TAKEN_DOWN'
  | 'PUBLISHER_SUSPENDED'

// https://developer.chrome.com/docs/webstore/webstore_api/items/publish/
export interface ItemPublishResponseData {
  kind: 'chromewebstore#item'
  item_id: string
  status: PublishStatus[]
  statusDetail: string[]
}
