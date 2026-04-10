import type {Metadata} from 'next';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'guko buddy',
  description: 'study better. study your way.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700&family=IBM+Plex+Sans+Devanagari:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <main className="flex-1 overflow-auto bg-background/50 backdrop-blur-sm px-4 py-8 md:px-8">
                <div className="max-w-7xl mx-auto animate-smooth-slow">
                  {children}
                </div>
              </main>
            </div>
          </SidebarProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
