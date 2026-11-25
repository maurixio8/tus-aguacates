
import { describe, expect, it, vi, afterEach } from 'vitest';
import sharp from 'sharp';
import { allowedSocialImageUrl, socialImageJpeg, fetchSocialImage } from '@/lib/social-product-image';

afterEach(() => { vi.unstubAllGlobals(); });
describe('social product image', () => {
  it('accepts public catalog hosts and rejects SSRF/credentials/non-HTTPS', () => {
    expect(allowedSocialImageUrl('https://gxqkmaaqoehydulksudj.supabase.co/storage/v1/object/public/a.webp')).toBe(true);
    for (const value of ['http://127.0.0.1/a', 'https://localhost/a', 'https://www.tusaguacates.com.evil.test/a', 'https://u:p@www.tusaguacates.com/a', 'https://www.tusaguacates.com:8443/a', 'file:///etc/passwd']) {
      expect(allowedSocialImageUrl(value)).toBe(false);
    }
  });
  it('converts WebP to an opaque JPEG of exactly 1200x630', async () => {
    const webp = await sharp({ create: { width: 1200, height: 1200, channels: 4, background: '#07180f' } }).webp().toBuffer();
    const jpeg = await socialImageJpeg(webp);
    const meta = await sharp(jpeg).metadata();
    expect(meta.format).toBe('jpeg');
    expect([meta.width, meta.height, meta.hasAlpha]).toEqual([1200, 630, false]);
  });
  it('rejects unsafe hosts without making any request', async () => {
    const mock = vi.fn(); vi.stubGlobal('fetch', mock);
    await expect(fetchSocialImage('https://127.0.0.1/a')).rejects.toThrow('not allowed');
    expect(mock).not.toHaveBeenCalled();
  });
  it('rejects non-image responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('html', { headers: { 'content-type': 'text/html' } })));
    await expect(fetchSocialImage('https://www.tusaguacates.com/a')).rejects.toThrow('unavailable');
  });
});
