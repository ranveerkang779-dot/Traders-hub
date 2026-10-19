import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { SITE_NAME } from "@/lib/sections";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Headings only (page-title, section-title, figure — see globals.css). Body
// text stays Geist Sans. A distinct display face for headings, rather than
// the same font for everything, is most of what keeps a page from reading
// as an unstyled default.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} | Compare trading products`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Discover and compare prop firms, brokers, courses, tools and signal groups. For information only — we do not verify trading performance.",
};

// Sets data-theme before hydration so the page never flashes the wrong
// theme. Defaults to dark (the product default) unless the visitor
// previously chose light mode.
const themeInitScript = `
  try {
    var theme = localStorage.getItem('theme');
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        {/* Impact reads `value` on this tag. The metadata API would emit `content` instead. */}
        <meta
          name="impact-site-verification"
          {...({
            value: "3f9050cb-b5d8-4655-b9b5-b2472e7da4e8",
          } as React.MetaHTMLAttributes<HTMLMetaElement>)}
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {/* Every page sits in the same centred container as the header. */}
        <main className="container-page flex-1 py-10 sm:py-14">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
