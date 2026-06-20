'use client';

import './globals.css';
import { usePathname } from 'next/navigation';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { NotificationManager } from '@/components/NotificationManager';
import { PomodoroProvider } from '@/components/pomodoro/pomodoro-context';
import { FloatingTimer } from '@/components/pomodoro/floating-timer';
import { ThemeApplier } from '@/components/theme/ThemeApplier';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Define routes that should NOT have the global Guko Buddy sidebar/layout
  const isImmersiveRoute = 
    pathname?.startsWith('/notebooks') || 
    pathname?.startsWith('/admin/wii-test') || 
    pathname?.startsWith('/admin/xbox-test') || 
    pathname?.startsWith('/admin/avatar-picker') ||
    pathname?.startsWith('/study-session');

  return (
    <html lang="en">
      <head>
        <title>guko buddy</title>
        <meta name="description" content="study better. study your way." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700&family=IBM+Plex+Sans+Devanagari:wght@400;500;600&family=Inter:wght@400;700&family=Crimson+Pro:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <ThemeApplier />
          <PomodoroProvider>
            <NotificationManager />
            
            {isImmersiveRoute ? (
              // Immersive routes render children directly with NO sidebar wrapper
              <div className="min-h-screen w-full relative">
                {children}
              </div>
            ) : (
              // Standard Dashboard Layout
              <SidebarProvider>
                <div className="flex min-h-screen w-full relative">
                  <AppSidebar />
                  <main className="flex-1 overflow-auto bg-background/50 backdrop-blur-sm px-4 py-6 md:px-8 md:py-8 transition-colors duration-500">
                    {/* Mobile Header with Sidebar Trigger */}
                    <header className="flex items-center gap-3 mb-8 md:hidden px-2 py-4 bg-white/80 backdrop-blur-md rounded-[32px] shadow-sm border border-border/40">
                      <SidebarTrigger className="h-10 w-10 rounded-xl hover:bg-muted" />
                      <div className="flex items-center gap-2 flex-1">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center p-1 flex-shrink-0 overflow-hidden">
                          <img 
                            src="/devmade-icons/gukologo.png" 
                            alt="guko logo" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <h2 className="font-headline font-bold text-lg tracking-tight lowercase">guko buddy</h2>
                      </div>
                    </header>
                    
                    <div className="max-w-7xl mx-auto">
                      {children}
                    </div>
                  </main>
                </div>
              </SidebarProvider>
            )}

            <FloatingTimer />
            <Toaster />
          </PomodoroProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
