// https://developer.chrome.com/docs/webstore/using-api#refresh_your_access_token
export interface OAuth2TokenResponse {
  access_token: string
  expires_in: number
  refresh_token: string
  scope: string
  token_type: 'Bearer'
}

// https://developer.chrome.com/docs/webstore/api/reference/rest/v2/UploadState
export type UploadState =
  | 'FAILED'
  | 'IN_PROGRESS'
  | 'NOT_FOUND'
  | 'SUCCEEDED'
  | 'UPLOAD_STATE_UNSPECIFIED'

// https://developer.chrome.com/docs/webstore/api/reference/rest/v2/media/upload#response-body
export interface UploadItemResponseData {
  name: string
  itemId: string
  crxVersion?: string
  uploadState: UploadState
}

// https://developer.chrome.com/docs/webstore/api/reference/rest/v2/ItemState
export type ItemState =
  | 'CANCELLED'
  | 'ITEM_STATE_UNSPECIFIED'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'PUBLISHED_TO_TESTERS'
  | 'REJECTED'
  | 'STAGED'

// https://developer.chrome.com/docs/webstore/api/reference/rest/v2/publishers.items/fetchStatus#itemrevisionstatus
export interface ItemRevisionStatus {
  state: ItemState
  distributionChannels?: {
    crxVersion: string
    deployPercentage: number
  }[]
}

// https://developer.chrome.com/docs/webstore/api/reference/rest/v2/publishers.items/fetchStatus#response-body
export interface FetchStatusResponseData {
  name: string
  itemId: string
  publicKey: string
  lastAsyncUploadState?: UploadState
  publishedItemRevisionStatus?: ItemRevisionStatus
  submittedItemRevisionStatus?: ItemRevisionStatus
  takenDown: boolean
  warned: boolean
}

// https://developer.chrome.com/docs/webstore/api/reference/rest/v2/publishers.items/publish
export interface ItemPublishResponseData {
  name: string
  itemId: string
  state: ItemState
}
