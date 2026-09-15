import * as CookieHub from './core';

export {
  initialize,
  load,
  hasAnswered,
  hasConsented,
  openDialog,
  closeDialog,
  openSettings,
  closeSettings,
  allowAll,
  denyAll,
} from './core';

export {
  blockedScriptAttributes,
  createBlockedScriptElement,
  googleAnalyticsScripts,
  facebookPixelScript,
  youtubeVideoID,
  youtubeEmbedURL,
  YOUTUBE_IFRAME_ALLOW,
  YOUTUBE_IFRAME_DEFAULTS,
} from './scripts';

export type {
  CookieHubStatus,
  LoadOptions,
  InitializeOptions,
} from './core';

export type {
  ConsentCategory,
  BlockedScript,
  BlockedScriptSrc,
  BlockedScriptInline,
  BlockedScriptAttributes,
} from './scripts';

/** Namespace export matching react-cookiehub's `CookieHub` object. */
export { CookieHub };
