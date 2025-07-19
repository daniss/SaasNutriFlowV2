import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, LogIn } from "lucide-react"

export default function ConfirmedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-soft-lg border-0">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
          </div>
          <CardTitle className="mt-4 text-xl font-semibold text-gray-900">Email confirmé !</CardTitle>
          <CardDescription className="mt-2">
            Votre adresse email a été vérifiée avec succès. Vous pouvez maintenant vous connecter à votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 text-center">
            <p>Bienvenue dans NutriFlow ! Votre compte est maintenant activé et prêt à être utilisé.</p>
          </div>

          <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
            <Link href="/login">
              <LogIn className="h-4 w-4 mr-2" />
              Se connecter
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}