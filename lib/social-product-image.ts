import sharp from 'sharp';

// Only catalog-owned, explicitly allowed public image hosts may be fetched.
const IMAGE_HOSTS = new Set([
  'www.tusaguacates.com', 'tusaguacates.com',
  'gxqkmaaqoehydulksudj.supabase.co', 'res.cloudinary.com',
  'i.ibb.co', 'images.unsplash.com',
]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function allowedSocialImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password &&
      (!url.port || url.port === '443') && IMAGE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export async function socialImageJpeg(input: Buffer): Promise<Buffer> {
  return sharp(input, { limitInputPixels: 40_000_000 })
    .rotate()
    // Preserve the full product artwork, including any text printed on it.
    .resize(1200, 630, { fit: 'contain', background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}

export async function fetchSocialImage(value: string): Promise<Buffer> {
  if (!allowedSocialImageUrl(value)) throw new Error('Image host is not allowed');
  const response = await fetch(value, {
    redirect: 'error',
    signal: AbortSignal.timeout(8000),
    headers: { Accept: 'image/*' },
  });
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) {
    throw new Error('Catalog image is unavailable');
  }
  if (Number(response.headers.get('content-length') || 0) > MAX_IMAGE_BYTES) {
    throw new Error('Catalog image is too large');
  }
  if (!response.body) throw new Error('Empty catalog image');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value: chunk, done } = await reader.read();
      if (done) break;
      bytes += chunk.byteLength;
      if (bytes > MAX_IMAGE_BYTES) throw new Error('Catalog image is too large');
      chunks.push(chunk);
    }
  } finally {
    await reader.cancel();
  }
  return Buffer.concat(chunks);
}
