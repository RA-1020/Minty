import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { NotificationsListener } from '@/components/notifications-listener';
import { TutorialProvider } from '@/lib/tutorial-context';
import { TutorialOverlay } from '@/components/tutorial-overlay';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Minty",
  description: "Your app description",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.className = theme;
                document.documentElement.style.colorScheme = theme;
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider>
            <NotificationsListener>
              <TutorialProvider>
                {children}
                <TutorialOverlay />
              </TutorialProvider>
            </NotificationsListener>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}