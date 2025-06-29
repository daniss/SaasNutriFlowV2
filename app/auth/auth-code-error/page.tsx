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
          <CardTitle className="mt-4 text-xl font-semibold text-gray-900">Authentication Error</CardTitle>
          <CardDescription className="mt-2">
            Sorry, we couldn't verify your email. The link may have expired or already been used.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>This could happen if:</p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>The confirmation link has expired</li>
              <li>The link has already been used</li>
              <li>There was an error with the verification process</li>
            </ul>
          </div>

          <div className="flex flex-col space-y-3">
            <Button asChild>
              <Link href="/login">
                <Mail className="h-4 w-4 mr-2" />
                Try Logging In
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link href="/signup">Create New Account</Link>
            </Button>

            <Button variant="ghost" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
