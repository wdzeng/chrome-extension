import * as core from '@actions/core'

// https://www.oauth.com/oauth2-servers/access-tokens/access-token-response/
interface OAuth2Response {
  access_token: string
  token_type: 'Bearer'
  expires_in?: number
  refresh_token?: string
  scope?: string
}

// https://www.oauth.com/oauth2-servers/access-tokens/access-token-response/
interface OAuth2ErrorResponse {
  error:
    | 'invalid_request'
    | 'invalid_client'
    | 'invalid_grant'
    | 'invalid_scope'
    | 'unauthorized_client'
    | 'unsupported_grant_type'
  error_description?: string
  error_uri?: string
}

export async function generateJwtToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  // https://developer.chrome.com/docs/webstore/using-api#refresh_your_access_token

  core.info('Refreshing access token.')
  const url = 'https://oauth2.googleapis.com/token'
  const payload = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  })
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload.toString()
  })

  if (response.ok) {
    const data = (await response.json()) as OAuth2Response
    const accessToken = data.access_token
    core.info('Access token refreshed.')
    return accessToken
  }

  if (response.status !== 400 && response.status !== 401) {
    // unexpected error
    const responseText = await response.text()
    core.error(responseText)
    throw new Error(`Error refreshing the access token. HTTP status code: ${response.status}`)
  }

  const errorData = (await response.json()) as OAuth2ErrorResponse
  switch (errorData.error) {
    case 'invalid_client':
      throw new Error('Invalid client. Is your client ID or client secret wrong?')
    case 'invalid_grant':
      throw new Error('Invalid grant. Is your refresh token wrong or revoked?')
    default:
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      core.error(errorData.error_description?.trim() || 'No error description provided.')
      throw new Error(`Error refreshing access token: ${errorData.error}`)
  }
}
