import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { auth } from "@/lib/auth";
import "@/lib/env";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kitify - Custom Branded Products for Companies",
  description:
    "Platform for companies to create custom branded product kits for employee onboarding.",
  icons: {
    icon: "/kitify-logo.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <Providers session={session}>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
