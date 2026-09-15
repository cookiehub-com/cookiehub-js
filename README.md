# cookiehub-js

Framework-agnostic JavaScript loader and API wrapper for the [CookieHub](https://www.cookiehub.com) consent platform.

This is the shared foundation for CookieHub's framework packages. `nuxt-cookiehub` is built on it, and `react-cookiehub` will migrate to it. It can also be used directly in any site or app without a framework.

It does three things:

1. Injects the CookieHub loader script for your domain and calls `cookiehub.load()` once it arrives.
2. Wraps the `window.cookiehub` API in functions that are safe to call before the script has loaded and safe to import during server-side rendering.
3. Provides the script-blocking contract (`type="text/plain"`, `data-src`, `data-consent`) and the Google Analytics, Facebook Pixel and YouTube snippets as plain data, so framework wrappers render them with their own element syntax.

It has no runtime dependencies.

## Install

```bash
npm install cookiehub-js
```

## Quick start

```ts
import { initialize, hasConsented, openSettings } from 'cookiehub-js';

initialize('YOUR-DOMAIN-CODE', {
  onStatusChange: (status, previous) => console.log(status, previous),
});

// Later, anywhere in your app:
if (hasConsented('analytics')) {
  // start analytics
}

document.querySelector('#cookie-settings')?.addEventListener('click', () => openSettings());
```

`initialize` must run in the browser. Call it from a client-side entry point, a mounted hook, or a client-only plugin. Calling it on the server is a harmless no-op.

## SSR

Every export can be imported and called on the server. `window` and `document` are resolved on each call rather than captured at import time, so a module first evaluated during server rendering still finds the browser globals once it runs on the client. On the server, `initialize` returns without doing anything and the API wrappers return `undefined`.

## API

### `initialize(domainId, options?)`

Injects `https://cdn.cookiehub.eu/c2/<domainId>.js` as the first child of `<head>`, with `id="CookieHub"` and `fetchpriority="high"`. When the script loads, `window.cookiehub.load(options)` is called with every option except `debug`.

It returns without doing anything when:

- there is no `window` or `document` (server rendering)
- `domainId` is empty
- an element with `id="CookieHub"` already exists, so calling it twice is safe

Two failure modes are reported with `console.error` and a message that says what to check:

- the CDN request fails (wrong domain id, blocked request)
- the script loads but does not define `window.cookiehub`

Options:

| Option | Type | Description |
| --- | --- | --- |
| `debug` | `boolean` | Log this package's own diagnostics to the console. Not forwarded to CookieHub. |
| `linker` | `string[]` | Domains that share consent state. |
| `onInitialise` | `(status) => void` | Called when CookieHub has initialised, with the current consent status. |
| `onStatusChange` | `(status, previousStatus) => void` | Called when the consent status changes. |
| `onAllow` | `(category) => void` | Called when a category is allowed. |
| `onRevoke` | `(category) => void` | Called when a category is revoked. |
| anything else | | Forwarded to `cookiehub.load()` as-is. |

`status` is CookieHub's consent status object, exported as the `CookieHubStatus` type: `answered`, `allAllowed`, `categories` (allowed category ids), `revision`, `dnt`, `timestamp` and a few more. CookieHub reuses and mutates the same object across calls, so copy it if you need to compare old and new values. The `LoadOptions` and `InitializeOptions` types are exported too.

### API wrappers

Each of these calls the method of the same name on `window.cookiehub`. Until the loader script has run and `cookiehub.hasInitialised` is true, they return `undefined` and do nothing.

| Function | Description |
| --- | --- |
| `load(options?)` | Calls `cookiehub.load()` again with new options. |
| `hasAnswered()` | Whether the user has allowed all or saved settings. |
| `hasConsented(category)` | Whether the given category name or id is allowed. |
| `openDialog()` | Opens the consent dialog shown on first visit. |
| `closeDialog()` | Closes the consent dialog. |
| `openSettings()` | Opens the settings dialog. Use this for a custom settings link. |
| `closeSettings()` | Closes the settings dialog. |
| `allowAll()` | Allows every category. |
| `denyAll()` | Denies every category. |

The same functions are also grouped on the `CookieHub` named export, matching react-cookiehub's `CookieHub` object:

```ts
import { CookieHub } from 'cookiehub-js';
CookieHub.initialize('YOUR-DOMAIN-CODE');
```

### Script blocking

CookieHub holds back a script until the user consents to its category when the tag is written as `<script type="text/plain" data-consent="analytics">`, with an external URL moved to `data-src` or the code left inline.

`ConsentCategory` is `'analytics' | 'marketing' | 'preferences' | 'necessary'`.

#### `blockedScriptAttributes(script)`

Takes `{ src, category, id? }` or `{ innerHTML, category, id? }` and returns the attributes for the blocked tag, or `undefined` if neither `src` nor `innerHTML` is set. `innerHTML`, when present, is the element's text content.

```ts
blockedScriptAttributes({ src: 'https://example.com/a.js', category: 'analytics' });
// { id: undefined, type: 'text/plain', 'data-src': 'https://example.com/a.js', 'data-consent': 'analytics' }
```

Framework wrappers spread this onto their `<script>` element.

#### `createBlockedScriptElement(script)`

For use without a framework. Returns an `HTMLScriptElement` with the attributes above, or `undefined` on the server or when the definition is incomplete. Append it yourself:

```ts
const el = createBlockedScriptElement({ src: 'https://example.com/a.js', category: 'analytics' });
if (el) document.head.appendChild(el);
```

#### `googleAnalyticsScripts(trackingID)`

Returns a two-element array: the gtag.js loader script and the inline bootstrap that configures the tracking id. Both are in the `analytics` category.

#### `facebookPixelScript(pixelID)`

Returns the inline Facebook Pixel bootstrap in the `marketing` category.

#### YouTube

- `youtubeVideoID(url)` extracts the 11-character id from `watch?v=`, `youtu.be/`, `embed/` and `v/` URLs, or returns `undefined`.
- `youtubeEmbedURL(videoID)` returns the `youtube-nocookie.com` embed URL, which sets no tracking cookies until playback.
- `YOUTUBE_IFRAME_ALLOW` is the default `allow` attribute value for the embed iframe.
- `YOUTUBE_IFRAME_DEFAULTS` is `{ width: 560, height: 315 }`.

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

Tests run in jsdom, with a separate suite under a bare Node environment to cover the server-rendering path. `npm publish` runs all three steps first via `prepublishOnly`.

## Versioning

This package started at 1.0.0. Never publish a version lower than the current `latest` without an explicit `--tag`, or `latest` will move backwards and strand installs on the older version.

## License

ISC
