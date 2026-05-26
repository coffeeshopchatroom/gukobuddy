import type {Metadata} from 'next';
import './globals.css';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { NotificationManager } from '@/components/NotificationManager';
import { PomodoroProvider } from '@/components/pomodoro/pomodoro-context';
import { FloatingTimer } from '@/components/pomodoro/floating-timer';

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
          <PomodoroProvider>
            <NotificationManager />
            <SidebarProvider>
              <div className="flex min-h-screen w-full">
                <AppSidebar />
                <main className="flex-1 overflow-auto bg-background/50 backdrop-blur-sm px-4 py-6 md:px-8 md:py-8">
                  {/* Mobile Header with Sidebar Trigger */}
                  <header className="flex items-center gap-3 mb-8 md:hidden">
                    <SidebarTrigger className="-ml-2 h-10 w-10 rounded-xl hover:bg-muted" />
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center p-1 flex-shrink-0 overflow-hidden">
                      <img 
                        src="/devmade-icons/gukologo.png" 
                        alt="guko logo" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <h2 className="font-headline font-bold text-lg tracking-tight lowercase">guko buddy</h2>
                  </header>
                  
                  <div className="max-w-7xl mx-auto animate-smooth-slow">
                    {children}
                  </div>
                </main>
              </div>
            </SidebarProvider>
            <FloatingTimer />
            <Toaster />
          </PomodoroProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
