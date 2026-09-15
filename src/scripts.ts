/**
 * Framework-neutral definitions for CookieHub's script blocking.
 *
 * CookieHub blocks a script until the user consents to its category when the
 * tag is rendered as `<script type="text/plain" data-consent="...">` with the
 * real URL moved to `data-src`, or the code left inline. These helpers produce
 * that contract as plain data so that each framework wrapper (React, Vue, ...)
 * can render it with its own element syntax, and so that the tracking snippets
 * live in exactly one place.
 */

export type ConsentCategory = 'analytics' | 'marketing' | 'preferences' | 'necessary';

export type BlockedScriptSrc = {
  id?: string;
  /** URL of the external script. Mutually exclusive with `innerHTML`. */
  src: string;
  innerHTML?: never;
  category: ConsentCategory;
};

export type BlockedScriptInline = {
  id?: string;
  src?: never;
  /** Inline script body. Mutually exclusive with `src`. */
  innerHTML: string;
  category: ConsentCategory;
};

export type BlockedScript = BlockedScriptSrc | BlockedScriptInline;

/**
 * Attributes for a consent-blocked `<script>` element. `innerHTML`, when
 * present, is the element's text content rather than an attribute.
 */
export type BlockedScriptAttributes = {
  id?: string;
  type: 'text/plain';
  'data-consent': ConsentCategory;
  'data-src'?: string;
  innerHTML?: string;
};

/**
 * Turns a script definition into the attributes CookieHub expects on a
 * blocked script tag. Returns undefined when neither `src` nor `innerHTML`
 * is given, mirroring react-cookiehub's `CookieHubScript` rendering null.
 */
export function blockedScriptAttributes(script: BlockedScript): BlockedScriptAttributes | undefined {
  const { id, src, innerHTML, category } = script;

  if (innerHTML && category) {
    return { id, type: 'text/plain', 'data-consent': category, innerHTML };
  }

  if (src && category) {
    return { id, type: 'text/plain', 'data-src': src, 'data-consent': category };
  }

  return undefined;
}

/**
 * Creates a consent-blocked `<script>` element for use without a framework.
 * Returns undefined outside a browser or when the definition is incomplete.
 * The caller appends the element wherever it belongs, typically `document.head`.
 */
export function createBlockedScriptElement(script: BlockedScript): HTMLScriptElement | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const attrs = blockedScriptAttributes(script);
  if (!attrs) {
    return undefined;
  }

  const el = document.createElement('script');
  if (attrs.id) {
    el.setAttribute('id', attrs.id);
  }
  el.setAttribute('type', attrs.type);
  if (attrs['data-src']) {
    el.setAttribute('data-src', attrs['data-src']);
  }
  el.setAttribute('data-consent', attrs['data-consent']);
  if (attrs.innerHTML) {
    el.textContent = attrs.innerHTML;
  }
  return el;
}

/**
 * The two blocked scripts needed for Google Analytics (gtag.js): the loader
 * and the inline bootstrap. Both are in the `analytics` category.
 */
export function googleAnalyticsScripts(trackingID: string): [BlockedScriptSrc, BlockedScriptInline] {
  return [
    {
      src: `https://www.googletagmanager.com/gtag/js?id=${trackingID}`,
      category: 'analytics',
    },
    {
      innerHTML: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${trackingID}');
        `,
      category: 'analytics',
    },
  ];
}

/**
 * The blocked inline script for the Facebook (Meta) Pixel, in the
 * `marketing` category.
 */
export function facebookPixelScript(pixelID: string): BlockedScriptInline {
  return {
    innerHTML: `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelID}');
        fbq('track', 'PageView');
      `,
    category: 'marketing',
  };
}

/**
 * Extracts the 11-character video ID from a YouTube URL in any of the common
 * shapes (watch?v=, youtu.be/, embed/, v/). Returns undefined if none is found.
 */
export function youtubeVideoID(url: string): string | undefined {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  return undefined;
}

/**
 * Privacy-enhanced embed URL for a YouTube video. The `youtube-nocookie.com`
 * host does not set tracking cookies until the user plays the video.
 */
export function youtubeEmbedURL(videoID: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoID}`;
}

/** Default `allow` attribute value for a YouTube embed iframe. */
export const YOUTUBE_IFRAME_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';

/** Default iframe dimensions used by the framework wrappers' YouTube components. */
export const YOUTUBE_IFRAME_DEFAULTS = { width: 560, height: 315 } as const;
