import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "Content X | Managed Content Production";
const description = "A managed creative team for strategy, scripts, editing and social delivery—with private matching, quality control and one accountable point of contact.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "contentx.example";
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
  const protocol = forwardedProtocol === "http" || forwardedProtocol === "https" ? forwardedProtocol : host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const base = new URL(`${protocol}://${host}`);
  const image = new URL("/og.png", base).toString();
  return {
    metadataBase: base,
    title,
    description,
    icons: { icon: "/favicon.svg" },
    openGraph: { title, description, siteName: "Content X", type: "website", url: base, images: [{ url: image, width: 1200, height: 630, alt: "Content X managed creative services" }] },
    twitter: { card: "summary_large_image", title, description, images: [image] }
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
