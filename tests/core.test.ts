import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
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
} from '../src/core';

type CookieHubWindow = Window & typeof globalThis & { cookiehub?: any };

const w = window as CookieHubWindow;
const DOMAIN = 'abc123';
const SRC = `https://cdn.cookiehub.eu/c2/${DOMAIN}.js`;

const injectedScript = () => document.getElementById('CookieHub') as HTMLScriptElement | null;

beforeEach(() => {
  document.head.innerHTML = '';
  delete w.cookiehub;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('initialize', () => {
  it('injects the CDN loader as the first child of <head>', () => {
    document.head.appendChild(document.createElement('meta'));

    initialize(DOMAIN);

    const script = injectedScript();
    expect(script).not.toBeNull();
    expect(script!.getAttribute('src')).toBe(SRC);
    expect(script!.getAttribute('type')).toBe('text/javascript');
    expect(script!.getAttribute('fetchpriority')).toBe('high');
    expect(document.head.firstChild).toBe(script);
  });

  it('does nothing without a domain id', () => {
    initialize('');
    expect(injectedScript()).toBeNull();
  });

  it('is idempotent: a second call does not inject a second script', () => {
    initialize(DOMAIN);
    initialize(DOMAIN);
    expect(document.querySelectorAll('script#CookieHub')).toHaveLength(1);
  });

  it('calls window.cookiehub.load() with every option except debug once the script loads', () => {
    const loadSpy = vi.fn();
    const onAllow = vi.fn();

    initialize(DOMAIN, { debug: true, linker: ['a.example'], onAllow, customOption: 42 });

    w.cookiehub = { load: loadSpy };
    injectedScript()!.onload!(new Event('load'));

    expect(loadSpy).toHaveBeenCalledTimes(1);
    expect(loadSpy).toHaveBeenCalledWith({ linker: ['a.example'], onAllow, customOption: 42 });
    expect(loadSpy.mock.calls[0][0]).not.toHaveProperty('debug');
  });

  it('reports an actionable error when the script loads but does not define window.cookiehub', () => {
    initialize(DOMAIN);

    injectedScript()!.onload!(new Event('load'));

    expect(console.error).toHaveBeenCalledTimes(1);
    const message = (console.error as any).mock.calls[0][0] as string;
    expect(message).toContain(SRC);
    expect(message).toContain('did not define window.cookiehub');
  });

  it('reports an actionable error when the CDN request fails', () => {
    initialize(DOMAIN);

    injectedScript()!.onerror!(new Event('error'));

    expect(console.error).toHaveBeenCalledTimes(1);
    const message = (console.error as any).mock.calls[0][0] as string;
    expect(message).toContain(`Failed to load ${SRC}`);
    expect(message).toContain('domain id');
  });
});

describe('API wrappers', () => {
  const methods = {
    load,
    hasAnswered,
    hasConsented,
    openDialog,
    closeDialog,
    openSettings,
    closeSettings,
    allowAll,
    denyAll,
  };

  it('return undefined and do not throw before CookieHub has initialised', () => {
    for (const fn of Object.values(methods)) {
      expect((fn as (...args: any[]) => unknown)('analytics')).toBeUndefined();
    }
  });

  it('return undefined when window.cookiehub exists but has not initialised', () => {
    w.cookiehub = { hasInitialised: false, hasConsented: vi.fn(() => true) };
    expect(hasConsented('analytics')).toBeUndefined();
    expect(w.cookiehub.hasConsented).not.toHaveBeenCalled();
  });

  it('forward to window.cookiehub once it has initialised', () => {
    w.cookiehub = {
      hasInitialised: true,
      load: vi.fn(),
      hasAnswered: vi.fn(() => true),
      hasConsented: vi.fn((c: string) => c === 'analytics'),
      openDialog: vi.fn(),
      closeDialog: vi.fn(),
      openSettings: vi.fn(),
      closeSettings: vi.fn(),
      allowAll: vi.fn(),
      denyAll: vi.fn(),
    };

    const options = { onAllow: vi.fn() };
    load(options);
    expect(w.cookiehub.load).toHaveBeenCalledWith(options);

    expect(hasAnswered()).toBe(true);
    expect(hasConsented('analytics')).toBe(true);
    expect(hasConsented('marketing')).toBe(false);

    openDialog();
    closeDialog();
    openSettings();
    closeSettings();
    allowAll();
    denyAll();

    for (const name of ['openDialog', 'closeDialog', 'openSettings', 'closeSettings', 'allowAll', 'denyAll']) {
      expect(w.cookiehub[name]).toHaveBeenCalledTimes(1);
    }
  });
});
