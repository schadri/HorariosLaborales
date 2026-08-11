import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Horarios Laborales | Vision OCR & Shorts Dashboard',
  description: 'Sistema inteligente de visualización y edición manual de horarios laborales automatizado mediante WhatsApp y AI Vision OCR.',
  authors: [{ name: 'Antigravity Senior Full Stack' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#090d16',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-surface-950 text-slate-100 min-h-screen antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
