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

// https://developer.chrome.com/docs/webstore/webstore_api/items/
export interface ItemResponseData {
  id: string
  itemError?: string[]
  kind: 'chromewebstore#item'
  publicKey: string | undefined
  uploadState: UploadState
}

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
