// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { initialize, hasConsented, openSettings } from '../src/core';
import { createBlockedScriptElement } from '../src/scripts';

// The SSR path: no window, no document. Nuxt renders on the server by
// default, so every export has to be safe to import and call there.
describe('without a browser environment', () => {
  it('has no window or document', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
  });

  it('initialize is a no-op that does not throw', () => {
    expect(() => initialize('abc123', { debug: true })).not.toThrow();
  });

  it('API wrappers return undefined without throwing', () => {
    expect(hasConsented('analytics')).toBeUndefined();
    expect(openSettings()).toBeUndefined();
  });

  it('createBlockedScriptElement returns undefined', () => {
    expect(createBlockedScriptElement({ src: 'https://x.example/a.js', category: 'analytics' })).toBeUndefined();
  });
});
