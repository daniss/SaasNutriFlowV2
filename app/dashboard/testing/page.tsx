"use client";

import { WorkflowTesting } from "@/components/testing/WorkflowTesting";
import { Card, CardContent } from "@/components/ui/card";
import { useRoleBasedAccess } from "@/hooks/useRoleBasedAccess";
import { AlertTriangle } from "lucide-react";

export default function TestingPage() {
  const { hasPermission, loading } = useRoleBasedAccess();

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  if (!hasPermission("canAccessTesting")) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 text-amber-600">
              <AlertTriangle className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Accès restreint</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Vous n'avez pas les permissions nécessaires pour accéder aux
                  tests E2E. Cette fonctionnalité est réservée aux
                  administrateurs système.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <WorkflowTesting />
    </div>
  );
}
