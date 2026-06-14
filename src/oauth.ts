import * as core from '@actions/core'
import axios from 'axios'

// https://developer.chrome.com/docs/webstore/using-api#refresh_your_access_token
interface OAuth2TokenResponse {
  access_token: string
  expires_in: number
  refresh_token: string
  scope: string
  token_type: 'Bearer'
}

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

  core.info('Access token refreshed.')
  return response.data.access_token
}
