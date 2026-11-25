import { buildSocialMetadata } from '@/lib/social-metadata';

export const metadata = buildSocialMetadata({ title: 'Preguntas frecuentes | Tus Aguacates', description: 'Respuestas a preguntas frecuentes sobre Tus Aguacates y tus pedidos.', path: '/faq' });

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
