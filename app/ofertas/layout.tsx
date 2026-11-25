import { buildSocialMetadata } from '@/lib/social-metadata';

export const metadata = buildSocialMetadata({ title: 'Ofertas | Tus Aguacates', description: 'Descubre las ofertas de productos de Tus Aguacates.', path: '/ofertas' });

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
