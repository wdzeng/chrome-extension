// https://developer.chrome.com/docs/webstore/using-api
// https://developers.google.com/identity/protocols/oauth2/web-server#httprest_3
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

export interface ItemRevisionStatus {
  state: ItemState
  distributionChannels?: {
    crxVersion: string
    deployPercentage: number
  }[]
}

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
