import { buildSocialMetadata } from '@/lib/social-metadata';

export const metadata = buildSocialMetadata({ title: 'Términos y condiciones | Tus Aguacates', description: 'Consulta los términos y condiciones de Tus Aguacates.', path: '/terminos' });

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
