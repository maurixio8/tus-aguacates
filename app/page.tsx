import { buildSocialMetadata } from '@/lib/social-metadata';
import type { Metadata } from 'next';
import HomeContent from './HomeContent';

export const metadata = { ...buildSocialMetadata({ title: 'Tus Aguacates | Aguacates y productos frescos', description: 'Compra aguacates, frutas y verduras frescas en línea con domicilio en Bogotá.', path: '/' }) };

export default function Home() {
  return <HomeContent />;
}
