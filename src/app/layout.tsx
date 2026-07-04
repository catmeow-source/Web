import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeInit from "@/components/ThemeInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Taskflow — Plan. Reflect. Improve.",
  description: "A reflective project and task management web application.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Inline script — runs synchronously before first paint to prevent
          theme flash. Sets data-theme on <html> from localStorage or
          system prefers-color-scheme. Must stay inline and compact.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var VALID = ['light','dark','liquid-glass','galaxy','jungle','beach','wild-west','cyberpunk','retro'];
                var theme;
                try { theme = localStorage.getItem('theme'); } catch(_) {}
                if (!theme || VALID.indexOf(theme) === -1) {
                  try {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  } catch(_) { theme = 'dark'; }
                }
                document.documentElement.setAttribute('data-theme', theme);
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col transition-colors duration-300"
        style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
      >
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
