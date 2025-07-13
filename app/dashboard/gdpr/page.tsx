"use client";

import { GDPRCompliance } from "@/components/gdpr/GDPRCompliance";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRoleBasedAccess } from "@/hooks/useRoleBasedAccess";
import { AlertTriangle } from "lucide-react";

export default function GDPRCompliancePage() {
  const { isAdmin, loading } = useRoleBasedAccess();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Accès refusé. Cette page est réservée aux administrateurs.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <GDPRCompliance />
    </div>
  );
}
