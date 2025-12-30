import { BusinessHeader } from '@/components/layout/BusinessHeader';
import { Footer } from '@/components/layout/Footer';

export default function EmpresasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BusinessHeader />
      {children}
      <Footer />
    </>
  );
}
