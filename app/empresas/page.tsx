import { buildSocialMetadata } from '@/lib/social-metadata';
import EmpresasPageClient from './EmpresasPageClient';

export const metadata = buildSocialMetadata({ title: 'Empresas | Tus Aguacates', description: 'Conoce los productos de Tus Aguacates para empresas en Bogotá.', path: '/empresas' });

export default function EmpresasPage() { return <EmpresasPageClient />; }
