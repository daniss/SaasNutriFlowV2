import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, Mail } from "lucide-react"

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="mt-4 text-xl font-semibold text-gray-900">Erreur de vérification</CardTitle>
          <CardDescription className="mt-2">
            Désolé, nous n'avons pas pu vérifier votre email. Le lien a peut-être expiré ou a déjà été utilisé.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>Cela peut arriver si :</p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Le lien de confirmation a expiré</li>
              <li>Le lien a déjà été utilisé</li>
              <li>Il y a eu une erreur lors du processus de vérification</li>
            </ul>
          </div>

          <div className="flex flex-col space-y-3">
            <Button asChild>
              <Link href="/login">
                <Mail className="h-4 w-4 mr-2" />
                Essayer de se connecter
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link href="/signup">Créer un nouveau compte</Link>
            </Button>

            <Button variant="ghost" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
