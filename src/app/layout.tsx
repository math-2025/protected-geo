import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/hooks/use-auth-provider';
import { FirebaseClientProvider } from '@/firebase';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'GeoGuard',
  description: 'Hərbi-Strateji İdarəetmə Sistemi',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <Suspense>
          <AuthProvider>
            <FirebaseClientProvider>
              {children}
            </FirebaseClientProvider>
          </AuthProvider>
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}
