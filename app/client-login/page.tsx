"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClientAuth } from "@/components/auth/ClientAuthProvider";
import { useAuth } from "@/hooks/useAuthNew";
import { Eye, EyeOff, Heart, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClientLoginPage() {
  const { login, isAuthenticated, isLoading } = useClientAuth();
  const { user: nutritionistUser, loading: nutritionistLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated as client
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/client-portal');
    }
  }, [isAuthenticated, isLoading, router]);

  // Redirect if nutritionist is authenticated - they shouldn't access client login
  useEffect(() => {
    if (nutritionistUser && !nutritionistLoading) {
      router.push('/dashboard');
    }
  }, [nutritionistUser, nutritionistLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsSubmitting(true);

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      router.push('/client-portal');
    } else {
      setLoginError(result.error || 'Erreur de connexion');
    }
    
    setIsSubmitting(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (loginError) setLoginError(""); // Clear error when user types
  };

  if (isLoading || nutritionistLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (isAuthenticated || nutritionistUser) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full">
            <Heart className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Portail Client</h1>
            <p className="text-gray-600">NutriFlow</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-soft-lg border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl text-gray-900">Connexion</CardTitle>
            <CardDescription className="text-gray-600">
              Accédez à votre espace personnel de suivi nutritionnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="votre@email.fr"
                    className="pl-10 border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Votre mot de passe"
                    className="pl-10 pr-10 border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{loginError}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || !formData.email || !formData.password}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 transition-colors duration-200"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Connexion...
                  </div>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                Problème de connexion ? Contactez votre nutritionniste.
              </p>
              <Link
                href="/"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200"
              >
                ← Retour au site principal
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo Info */}
        <Card className="bg-blue-50 border-blue-200 shadow-soft">
          <CardContent className="pt-4">
            <p className="text-xs text-blue-700 text-center">
              <strong>Mode démo:</strong> Utilisez les identifiants fournis par votre nutritionniste
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
