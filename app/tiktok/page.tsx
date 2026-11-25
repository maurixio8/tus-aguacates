import { buildSocialMetadata } from '@/lib/social-metadata';
import type { Metadata } from 'next';
import TikTokPublisher from '@/components/tiktok/TikTokPublisher';

export const metadata = { ...buildSocialMetadata({ title: 'Publicar en TikTok | Tus Aguacates', description: 'Prepara y revisa contenido de Tus Aguacates para publicarlo en TikTok.', path: '/tiktok' }), robots: { index: false, follow: false } };

export default function TikTokPage() {
  return <TikTokPublisher />;
}
