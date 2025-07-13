import { AuthProvider } from "@/components/auth/AuthProviderNew";
import { ClientAuthProvider } from "@/components/auth/ClientAuthProvider";
import { ClientAuthRouter } from "@/components/auth/ClientAuthRouter";
import { TwoFactorProvider } from "@/components/auth/TwoFactorProvider";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type React from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NutriFlow - Dietitian Dashboard",
  description: "Modern SaaS platform for independent dietitians",
  generator: "v0.dev",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <TwoFactorProvider>
            <ClientAuthProvider>
              <ClientAuthRouter />
              {children}
            </ClientAuthProvider>
          </TwoFactorProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
