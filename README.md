# Chrome Extension

[![version](https://img.shields.io/github/v/release/wdzeng/chrome-extension)](https://github.com/wdzeng/chrome-extension/releases/latest)
[![license](https://img.shields.io/github/license/wdzeng/chrome-extension?color=red)](https://github.com/wdzeng/chrome-extension/blob/main/LICENSE)

This action publishes your Chrome extension to
[Chrome Web Store](https://chrome.google.com/webstore/) using the
[Chrome Web Store API v1.1](https://developer.chrome.com/docs/webstore/api_index/#items).

This action can only publish new version of an existing extension. Publishing new extension is not
supported.

## Preparation

Following items are required before publishing your Chrome extension:

- A zip file to be uploaded.
- An API client ID and secret.
- A refresh token.

Please refer to this [tutorial](https://developer.chrome.com/docs/webstore/using_webstore_api/) for
how to generate API keys and refresh token.

## Usage

Unless otherwise noted with a default value, all options are required.

- `extension-id`: the id of your extension; can be referred from the url of your extension page on
  the Web Store.
- `zip-path`: path to the zip file built in the previous steps. May include a glob pattern (only one
  file must match)
- `tester-only`: (boolean) `true` indicates publishing to testers only; default to `false`.
- `upload-only`: (boolean) `true` indicates this extension will be uploaded without publishing
  (you'll have to publish it manually); default to `false`.
- `client-id`: your API client ID.
- `client-secret`: your API client secret.
- `refresh-token`: your refresh token.
- `check-credentials-only`: (boolean) only test if given credentials are working; do not upload
  or publish the extension; enabling this option will ignore `extension-id`, `zip-path`,
  `tester-only` and `upload-only` and make these options optional; default to `false`.

Example of uploading and publishing an extension:

```yaml
steps:
  - uses: wdzeng/chrome-extension@v1
    with:
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
      check-credentials-only: true
```

## References

- [Obtaining OAuth 2.0 access tokens](https://developers.google.com/identity/protocols/oauth2/web-server#httprest_1)
- [Using the Chrome Web Store Publish API](https://developer.chrome.com/docs/webstore/using_webstore_api/)
- [Chrome Web Store API](https://developer.chrome.com/docs/webstore/api_index/)

## Sister Actions

- [Edge Add-on Action](https://github.com/wdzeng/edge-addon)
- [Firefox Add-on Action](https://github.com/wdzeng/firefox-addon)
