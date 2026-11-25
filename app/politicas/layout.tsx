import { buildSocialMetadata } from '@/lib/social-metadata';

export const metadata = buildSocialMetadata({ title: 'Políticas | Tus Aguacates', description: 'Consulta las políticas de Tus Aguacates.', path: '/politicas' });

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
