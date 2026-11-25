import { buildSocialMetadata } from '@/lib/social-metadata';

export const metadata = buildSocialMetadata({ title: 'Privacidad | Tus Aguacates', description: 'Consulta la política de privacidad de Tus Aguacates.', path: '/privacidad' });

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
