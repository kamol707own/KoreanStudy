import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { AccountProvider } from "@/components/account-provider";
import { locales, type AppLocale } from "@/i18n/routing";
import { THEME_COLORS } from "@/lib/theme";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// UI font loaded for the Chinese locale (Geist does not cover CJK).
// Noto Sans KR stays in the shared stack for all the Korean text on the page.
const LOCALE_UI_FONT: Partial<Record<AppLocale, string>> = {
  zh: '"Noto Sans SC", "Noto Sans KR", sans-serif',
};

const LOCALE_FONT_HREF: Partial<Record<AppLocale, string>> = {
  zh: "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// viewport-fit=cover lets the PWA render edge-to-edge on devices with system
// bars (iOS status bar + home indicator, Android gesture nav). Combined with
// env(safe-area-inset-*) this makes our sticky chrome clear the bars while the
// app background stays continuous behind them. NOTE: Next.js does NOT include
// viewport-fit=cover by default, so we must declare it explicitly here.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("title"),
    description: t("description"),
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: "Study Korean",
      statusBarStyle: "default",
    },
    icons: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!locales.includes(locale as AppLocale)) {
    notFound();
  }

  const appLocale = locale as AppLocale;
  const messages = await getMessages();
  const uiFont = LOCALE_UI_FONT[appLocale];
  const fontHref = LOCALE_FONT_HREF[appLocale];

  // The theme is persisted in a cookie (written by the theme toggles). Read it
  // server-side so locale navigation — which re-renders this layout — keeps the
  // saved theme instead of resetting to dark. Falls back to dark when absent.
  const theme = (await cookies()).get("korean-study-theme")?.value;
  const savedTheme = theme === "light" ? "light" : "dark";

  return (
    <html
      lang={appLocale}
      data-theme={savedTheme}
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Status bar matches the saved theme (server-rendered from cookie). */}
        <meta name="theme-color" content={THEME_COLORS[savedTheme]} />
        {fontHref && <link rel="stylesheet" href={fontHref} />}
        {/* Applies the saved theme before first paint. Without this the page
            renders dark, then flips once React mounts. A plain server-rendered
            <script> runs during HTML parse (before paint); next/script's
            beforeInteractive strategy is not valid here and made React warn
            "Encountered a script tag while rendering React component". */}
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `try{var t=(document.cookie.match(/(?:^|;\\s*)korean-study-theme=([^;]*)/)||[])[1];if(t!=='light'&&t!=='dark'){t=localStorage.getItem('korean-study-theme')}if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',t==='light'?'#f5f0eb':'#0a0a0a')}catch(e){}`,
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col font-sans"
        style={{
          fontFamily: uiFont ?? 'var(--font-geist-sans), "Noto Sans KR", sans-serif',
        }}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
          <AccountProvider>{children}</AccountProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
