type CookieHubWindow = Window & typeof globalThis & { cookiehub?: any };

let _debug = false;

const _isNotBrowser = () =>
  typeof window === 'undefined' || typeof document === 'undefined';

const _getWindow = (): CookieHubWindow | undefined => {
  if (_isNotBrowser()) {
    if (_debug === true) {
      console.log('CookieHub: Could not find window object')
    }
    return undefined;
  }
  return window as CookieHubWindow;
}

/**
 * Returns the CookieHub global once the SDK script has loaded and initialised,
 * or undefined if it hasn't. The window object is resolved on every call rather
 * than once at import time, so a module first evaluated on the server (Next.js)
 * still picks up the browser window once it is available.
 */
const _getInitialized = () => {
  const _w = _getWindow();
  if (!_w || !_w.cookiehub || !_w.cookiehub.hasInitialised) {
    return undefined;
  }
  return _w.cookiehub;
}

/**
 * The consent status object CookieHub passes to `onInitialise` and
 * `onStatusChange`. CookieHub reuses and mutates the same object across
 * calls, so copy it if you need to compare old and new values.
 */
export type CookieHubStatus = {
  /** Whether the user has answered the dialog (allowed all or saved settings). */
  answered: boolean;
  /** Whether every category is allowed. */
  allAllowed: boolean;
  /** Ids of the allowed categories. */
  categories: number[];
  vendors: unknown[];
  services: unknown[];
  revision: number;
  dnt: boolean;
  allowSale: boolean;
  /** Spelled as CookieHub spells it. */
  implict: boolean;
  region: string;
  token: string;
  timestamp: string;
  [field: string]: unknown;
}

export type LoadOptions = {
  linker?: string[];
  onInitialise?: (status: CookieHubStatus) => void;
  onStatusChange?: (status: CookieHubStatus, previousStatus: CookieHubStatus) => void;
  onAllow?: (category: string) => void;
  onRevoke?: (category: string) => void;
  /** Any other option accepted by the CookieHub platform is passed through as-is. */
  [option: string]: unknown;
}

export type InitializeOptions = LoadOptions & {
  debug?: boolean;
}

/**
 * Strips `debug`, which is this package's own option rather than one the
 * platform accepts, and forwards every remaining option to cookiehub.load().
 */
const _toLoadOptions = (options?: InitializeOptions): LoadOptions => {
  if (!options) {
    return {};
  }
  const { debug, ...cpm } = options;
  return cpm;
}

/**
 * Initializes CookieHub with the specified domain id. This method must be called before any other CookieHub methods.
 * @param domainId 
 * @param {InitializeOptions} options - (object): An object containing a list of options and events. Every option other than `debug` is forwarded to CookieHub as-is.
 * @param {boolean} [options.debug=false] - If set to true, debug messages will be logged to the console. This option is not forwarded to CookieHub.
 * @param {string[]} [options.linker] - An array of domains to link. This is useful if you have multiple domains and want to share the same cookie consent between them.
 * @param {function} [options.onInitialise] - A callback function that will be called once CookieHub has initialised, with the current consent status.
 * @param {function} [options.onStatusChange] - A callback function that will be called when the user's consent status changes.
 * @param {function} [options.onAllow] - A callback function that will be called when the user allows a cookie category.
 * @param {function} [options.onRevoke] - A callback function that will be called when the user revokes a cookie category.
 * @returns 
 */
export function initialize(domainId: string, options?: InitializeOptions) {
  if (options?.debug === true) {
    _debug = true;
  }

  if (_isNotBrowser()) {
    if (_debug === true) {
      console.log('CookieHub: Could not find window object')
    }
    return;
  }

  if (!domainId) {
    if (_debug === true) {
      console.log('CookieHub: Missing domainId')
    }
    return;
  }

  // Skip if CookieHub is already initialized
  const elem = document.getElementById('CookieHub');
  if (elem !== null) {
    if (_debug === true) {
      console.log('CookieHub: Already initialized')
    }
    return;
  }

  const src = `https://cdn.cookiehub.eu/c2/${domainId}.js`;

  const script = document.createElement('script');
  script.setAttribute('id', 'CookieHub');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', src);
  script.setAttribute('fetchpriority', 'high')
  script.onload = () => {
    const _w = _getWindow();

    if (!_w?.cookiehub) {
      console.error(
        `CookieHub: ${src} loaded but did not define window.cookiehub. ` +
        'The consent dialog will not be displayed.'
      );
      return;
    }

    _w.cookiehub.load(_toLoadOptions(options));

    if (_debug === true) {
      console.log('CookieHub loaded');
    }
  };
  script.onerror = () => {
    console.error(
      `CookieHub: Failed to load ${src}. The consent dialog will not be displayed. ` +
      'Check that the domain id is correct and that the request is not being blocked.'
    );
  };
  const head = document.querySelector('html > head');
  if (!head) {
    if (_debug === true) {
      console.log('CookieHub: Could not find head element');
    }
    return;
  };
  head.insertBefore(script, head.firstChild);
}

/**
 * Calls the CookieHub `load()` method after the SDK has been initialised via `initialize()`. Has no effect if called before the SDK script has loaded.
 * @param options (object): An object containing a list of options and events.
 */
export const load = (options: LoadOptions = {}) => {
  const cookiehub = _getInitialized();
  if (!cookiehub) {
    return;
  }
  
  if (_debug === true) {
    console.log('CookieHub: load');
  }

  return cookiehub.load(options);
}

/**
 * Checks if the user has already made cookie choices by allowing all cookies or saving settings. This method doesn't accept any parameters.
 */
export const hasAnswered = () => {
  const cookiehub = _getInitialized();
  if (!cookiehub) {
    return;
  }
  
  if (_debug === true) {
    console.log('CookieHub: hasAnswered');
  }

  return cookiehub.hasAnswered();
}

/**
 *  Checks if the user has allowed the specified cookie category.
 * @param category The name or ID of the cookie category to check.
 */
export const hasConsented = (category:string) => {
  const cookiehub = _getInitialized();
  if (!cookiehub) {
    return;
  }
  
  if (_debug === true) {
    console.log('CookieHub: hasConsented');
  }

  return cookiehub.hasConsented(category);
}

/**
 *  Opens the CookieHub dialog, typically displayed on the first load.
 */
export const openDialog = () => {
  const cookiehub = _getInitialized();
  if (!cookiehub) {
    return;
  }
  
  if (_debug === true) {
    console.log('CookieHub: openDialog');
  }
  
  return cookiehub.openDialog();
}

/**
 *  Closes the CookieHub dialog if it's still open.
 */
export const closeDialog = () => {
  const cookiehub = _getInitialized();
  if (!cookiehub) {
    return;
  }
  
  if (_debug === true) {
    console.log('CookieHub: closeDialog');
  }
  
  return cookiehub.closeDialog();
}

/**
 *  Opens the CookieHub settings dialog. Useful if you've hidden the settings icon and want to create a custom link or button for opening the settings dialog.
 */
export const openSettings = () => {
  const cookiehub = _getInitialized();
  if (!cookiehub) {
    return;
  }
  
  if (_debug === true) {
    console.log('CookieHub: openSettings');
  }

  return cookiehub.openSettings();
}

/**
 *  Closes the CookieHub settings dialog.
 */
export const closeSettings = () => {
  const cookiehub = _getInitialized();
  if (!cookiehub) {
    return;
  }
  
  if (_debug === true) {
    console.log('CookieHub: closeSettings');
  }

  return cookiehub.closeSettings();
}

/**
 *  Allows all cookie categories. This method offers an alternative way for users to consent to all categories.
 */
export const allowAll = () => {
  const cookiehub = _getInitialized();
  if (!cookiehub) {
    return;
  }
  
  if (_debug === true) {
    console.log('CookieHub: allowAll');
  }
  
  return cookiehub.allowAll();
}

/**
 *  Denies all cookie categories. Similar to allowAll(), this method offers an alternative way for users to revoke consent for all categories.
 */
export const denyAll = () => {
  const cookiehub = _getInitialized();
  if (!cookiehub) {
    return;
  }
  
  if (_debug === true) {
    console.log('CookieHub: denyAll');
  }
  
  return cookiehub.denyAll();
}

export default {
  initialize,
  load,
  hasAnswered,
  hasConsented,
  openDialog,
  closeDialog,
  openSettings,
  closeSettings,
  allowAll,
  denyAll
}
