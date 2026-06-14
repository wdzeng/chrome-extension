# Chrome Extension

[![version](https://img.shields.io/github/v/release/wdzeng/chrome-extension)](https://github.com/wdzeng/chrome-extension/releases/latest)
[![license](https://img.shields.io/github/license/wdzeng/chrome-extension?color=red)](https://github.com/wdzeng/chrome-extension/blob/main/LICENSE)

This action publishes your Chrome extension to
[Chrome Web Store](https://chrome.google.com/webstore/) using the
[Chrome Web Store API v2](https://developer.chrome.com/docs/webstore/api).

This action can only publish new version of an existing extension. Publishing new extension is not
supported.

## Preparation

Following items are required before publishing your Chrome extension:

- A zip file to be uploaded.
- Your Chrome Web Store publisher ID.
- An API client ID and secret.
- A refresh token.

Please refer to this [tutorial](https://developer.chrome.com/docs/webstore/using-api) for how to
generate API keys, refresh token, and locate your publisher ID.

## Usage

Unless otherwise noted with a default value, all options are required.

- `publisher-id`: your Chrome Web Store publisher ID, available in the Developer Dashboard account
  section.
- `extension-id`: the id of your extension; can be referred from the url of your extension page on
  the Web Store.
- `zip-path`: path to the zip file built in the previous steps. May include a glob pattern (only one
  file must match)
- `client-id`: your API client ID.
- `client-secret`: your API client secret.
- `refresh-token`: your refresh token.
- `action`: one of:
  - `publish` (default): to upload and publish the extension.
  - `upload`: to upload the extension but not to publish.
  - `check-credentials`: to only test if given credentials are working; this option ignores
    `publisher-id`, `extension-id`, and `zip-path`, and make these options optional

Example of uploading and publishing an extension:

```yaml
steps:
  - uses: wdzeng/chrome-extension@v1
    with:
      publisher-id: your-publisher-id
      extension-id: your-extension-id
      zip-path: your-extension.zip
      client-id: ${{ secrets.CHROME_CLIENT_ID }}
      client-secret: ${{ secrets.CHROME_CLIENT_SECRET }}
      refresh-token: ${{ secrets.CHROME_REFRESH_TOKEN }}
```

Example of testing if credentials are working:

```yaml
steps:
  - uses: wdzeng/chrome-extension@v1
    with:
      client-id: ${{ secrets.CHROME_CLIENT_ID }}
      client-secret: ${{ secrets.CHROME_CLIENT_SECRET }}
      refresh-token: ${{ secrets.CHROME_REFRESH_TOKEN }}
      action: check-credentials
```

## References

- [Obtaining OAuth 2.0 access tokens](https://developers.google.com/identity/protocols/oauth2/web-server#httprest_1)
- [Use the Chrome Web Store API](https://developer.chrome.com/docs/webstore/using-api)
- [Chrome Web Store API](https://developer.chrome.com/docs/webstore/api)

## Sister Actions

- [Edge Add-on Action](https://github.com/wdzeng/edge-addon)
- [Firefox Add-on Action](https://github.com/wdzeng/firefox-addon)
