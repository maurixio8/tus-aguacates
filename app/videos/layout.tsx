import { buildSocialMetadata } from '@/lib/social-metadata';

export const metadata = buildSocialMetadata({ title: 'Videos | Tus Aguacates', description: 'Descubre los videos de Tus Aguacates.', path: '/videos' });

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
