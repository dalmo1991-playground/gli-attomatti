import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { getContent } from "@/lib/data";
import { SITE_URL, DEFAULT_SEO, getOrganizationJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const dynamic = 'force-dynamic';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const siteName = content?.site?.name || DEFAULT_SEO.siteName;
  const description = content?.site?.description || DEFAULT_SEO.defaultDescription;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: DEFAULT_SEO.defaultTitle,
      template: DEFAULT_SEO.titleTemplate,
    },
    description,
    keywords: DEFAULT_SEO.keywords,
    authors: [{ name: siteName, url: SITE_URL }],
    creator: siteName,
    publisher: siteName,
    icons: {
      icon: [
        { url: "/logo_attomatti.svg", type: "image/svg+xml" },
        { url: "/favicon.ico" },
      ],
      apple: "/logo_attomatti.svg",
    },
    alternates: {
      canonical: "./",
    },
    openGraph: {
      title: DEFAULT_SEO.defaultTitle,
      description,
      url: SITE_URL,
      siteName,
      locale: DEFAULT_SEO.locale,
      type: "website",
      images: [
        {
          url: `${SITE_URL}${DEFAULT_SEO.defaultImage}`,
          width: 1200,
          height: 630,
          alt: `${siteName} — Compagnia Teatrale Zurigo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: DEFAULT_SEO.defaultTitle,
      description,
      images: [`${SITE_URL}${DEFAULT_SEO.defaultImage}`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

const devThemeBootstrapScript = `
(function() {
  try {
    var host = window.location.hostname;
    if (host === 'gliattomatti.ch' || host === 'www.gliattomatti.ch') return;
    var saved = localStorage.getItem('attomatti_dev_custom_theme');
    if (saved) {
      var colors = JSON.parse(saved);
      var root = document.documentElement;
      if (colors.background) root.style.setProperty('--background', colors.background);
      if (colors.foreground) root.style.setProperty('--foreground', colors.foreground);
      if (colors.primary) root.style.setProperty('--primary', colors.primary);
      if (colors.secondary) root.style.setProperty('--secondary', colors.secondary);
      if (colors.accent) root.style.setProperty('--accent', colors.accent);
      if (colors.muted) root.style.setProperty('--muted', colors.muted);
    }
  } catch(e) {}
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = await getContent();
  const isDevBuild =
    process.env.NODE_ENV !== "production" ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF === "dev" ||
    process.env.GITHUB_BRANCH === "dev";

  return (
    <html lang={content.site.language} suppressHydrationWarning>
      <head>
        <JsonLd data={getOrganizationJsonLd()} />
        {isDevBuild && (
          <script dangerouslySetInnerHTML={{ __html: devThemeBootstrapScript }} />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-primary/20 selection:text-primary`}
      >
        <LayoutWrapper content={content}>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
