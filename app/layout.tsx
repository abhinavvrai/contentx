import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Content X | Create. Review. Publish.",
  description: "Premium video editing with private uploads, timestamped feedback, version review and approvals.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
