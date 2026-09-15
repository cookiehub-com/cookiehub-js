import { describe, expect, it } from 'vitest';
import {
  blockedScriptAttributes,
  createBlockedScriptElement,
  googleAnalyticsScripts,
  facebookPixelScript,
  youtubeVideoID,
  youtubeEmbedURL,
} from '../src/scripts';

describe('blockedScriptAttributes', () => {
  it('produces the data-src contract for an external script', () => {
    expect(blockedScriptAttributes({ id: 'ga', src: 'https://x.example/a.js', category: 'analytics' })).toEqual({
      id: 'ga',
      type: 'text/plain',
      'data-src': 'https://x.example/a.js',
      'data-consent': 'analytics',
    });
  });

  it('keeps inline code as innerHTML with no data-src', () => {
    const attrs = blockedScriptAttributes({ innerHTML: 'console.log(1)', category: 'marketing' });
    expect(attrs).toEqual({
      id: undefined,
      type: 'text/plain',
      'data-consent': 'marketing',
      innerHTML: 'console.log(1)',
    });
    expect(attrs).not.toHaveProperty('data-src');
  });

  it('returns undefined when neither src nor innerHTML is given', () => {
    expect(blockedScriptAttributes({ src: '', category: 'analytics' })).toBeUndefined();
  });
});

describe('createBlockedScriptElement', () => {
  it('builds a text/plain script element that the browser will not execute', () => {
    const el = createBlockedScriptElement({ id: 'px', src: 'https://x.example/p.js', category: 'marketing' })!;
    expect(el.tagName).toBe('SCRIPT');
    expect(el.id).toBe('px');
    expect(el.getAttribute('type')).toBe('text/plain');
    expect(el.getAttribute('data-src')).toBe('https://x.example/p.js');
    expect(el.getAttribute('data-consent')).toBe('marketing');
    expect(el.hasAttribute('src')).toBe(false);
  });

  it('puts inline code in the element body', () => {
    const el = createBlockedScriptElement({ innerHTML: 'fbq("init")', category: 'marketing' })!;
    expect(el.textContent).toBe('fbq("init")');
    expect(el.hasAttribute('data-src')).toBe(false);
  });
});

describe('tracking snippets', () => {
  it('googleAnalyticsScripts returns the gtag loader and bootstrap in the analytics category', () => {
    const [loader, bootstrap] = googleAnalyticsScripts('G-TEST123');
    expect(loader).toEqual({
      src: 'https://www.googletagmanager.com/gtag/js?id=G-TEST123',
      category: 'analytics',
    });
    expect(bootstrap.category).toBe('analytics');
    expect(bootstrap.innerHTML).toContain("gtag('config', 'G-TEST123')");
    expect(bootstrap.innerHTML).toContain('window.dataLayer');
  });

  it('facebookPixelScript returns the pixel bootstrap in the marketing category', () => {
    const pixel = facebookPixelScript('987654321');
    expect(pixel.category).toBe('marketing');
    expect(pixel.innerHTML).toContain("fbq('init', '987654321')");
    expect(pixel.innerHTML).toContain('connect.facebook.net/en_US/fbevents.js');
  });
});

describe('YouTube helpers', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ#t=10', 'dQw4w9WgXcQ'],
  ])('extracts the id from %s', (url, id) => {
    expect(youtubeVideoID(url)).toBe(id);
  });

  it('returns undefined for URLs without an 11-character id', () => {
    expect(youtubeVideoID('https://example.com/video')).toBeUndefined();
    expect(youtubeVideoID('https://youtu.be/short')).toBeUndefined();
  });

  it('builds a youtube-nocookie embed URL', () => {
    expect(youtubeEmbedURL('dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });
});
