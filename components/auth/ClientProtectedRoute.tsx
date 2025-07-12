"use client";

import { useClientAuth } from "@/components/auth/ClientAuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ClientProtectedRouteProps {
  children: React.ReactNode;
}

export function ClientProtectedRoute({ children }: ClientProtectedRouteProps) {
  const { client, isLoading, isAuthenticated, logout } = useClientAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/client-login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/client-login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-gray-600">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <Card className="max-w-md shadow-soft-lg border-0">
          <CardHeader className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mx-auto">
              <Heart className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">Accès non autorisé</CardTitle>
            <CardDescription className="text-gray-600">
              Vous devez être connecté pour accéder à votre portail client.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/client-login')}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
