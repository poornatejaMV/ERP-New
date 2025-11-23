import type { Metadata } from 'next';
import LayoutWrapper from '@/components/LayoutWrapper';
import './globals.css';

export const metadata: Metadata = {
  title: 'ERP System',
  description: 'Enterprise Resource Planning',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
