"use client";

import { ClientAuthProvider } from "@/components/auth/ClientAuthProvider";

export default function ClientLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientAuthProvider>
      {children}
    </ClientAuthProvider>
  );
}
