"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { User, Heart } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-xl font-bold text-gray-900">NutriFlow</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Choisissez votre espace
            </h1>
            <p className="text-gray-600">
              Connectez-vous selon votre profil
            </p>
          </div>

          {/* Login Options */}
          <div className="space-y-4">
            {/* Nutritionist Login */}
            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-emerald-200">
              <CardContent className="p-6">
                <Link href="/login" className="block">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Espace Nutritionniste
                      </h3>
                      <p className="text-sm text-gray-600">
                        Accédez à votre tableau de bord professionnel
                      </p>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Client Login */}
            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-pink-200">
              <CardContent className="p-6">
                <Link href="/client-login" className="block">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Heart className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Portail Client
                      </h3>
                      <p className="text-sm text-gray-600">
                        Suivez vos plans et votre progression
                      </p>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Footer Text */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              Votre assistant numérique pour diététiciens
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
