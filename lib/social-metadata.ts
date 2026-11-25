import type { Metadata } from 'next';

export const SITE_URL = 'https://www.tusaguacates.com';
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/images/og-social.png`;

type SocialMetadataOptions = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  imageAlt?: string;
  type?: 'website' | 'article';
};

export function buildSocialMetadata({ title, description, path, image, imageAlt, type = 'website' }: SocialMetadataOptions): Metadata {
  const url = new URL(path, SITE_URL).toString();
  const imageUrl = image?.trim() ? new URL(image, SITE_URL).toString() : DEFAULT_SOCIAL_IMAGE;
  const alt = imageAlt || title;
  const socialImage = imageUrl === DEFAULT_SOCIAL_IMAGE
    ? { url: imageUrl, width: 1200, height: 630, alt }
    : { url: imageUrl, alt };

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type, locale: 'es_CO', siteName: 'Tus Aguacates', images: [socialImage] },
    twitter: { card: 'summary_large_image', title, description, images: [imageUrl] },
  };
}
