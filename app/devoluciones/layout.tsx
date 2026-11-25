import { buildSocialMetadata } from '@/lib/social-metadata';

export const metadata = buildSocialMetadata({ title: 'Devoluciones | Tus Aguacates', description: 'Consulta la política de devoluciones de Tus Aguacates.', path: '/devoluciones' });

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
