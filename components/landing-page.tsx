"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Wand2,
  Bell,
  Receipt,
  ArrowRight,
  Check,
  Star,
  Menu,
  X,
  Sparkles,
  Heart,
  Shield,
  Zap,
  Target,
  BarChart3,
} from "lucide-react"
import Link from "next/link"

export function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-sm">
                N
              </div>
              <span className="font-bold text-xl text-gray-900">NutriFlow</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection("features")}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Fonctionnalités
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Tarifs
              </button>
              <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
                Connexion
              </Link>
              <Button
                asChild
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                <Link href="/signup">Commencer</Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600">
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden bg-white border-t">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <button
                  onClick={() => scrollToSection("features")}
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors w-full text-left"
                >
                  Fonctionnalités
                </button>
                <button
                  onClick={() => scrollToSection("pricing")}
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors w-full text-left"
                >
                  Tarifs
                </button>
                <Link href="/login" className="block px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors">
                  Connexion
                </Link>
                <div className="px-3 py-2">
                  <Button asChild className="w-full bg-gradient-to-r from-emerald-500 to-teal-600">
                    <Link href="/signup">Commencer</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Plateforme de Nutrition IA
                </Badge>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Gagnez du temps et{" "}
                  <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                    accompagnez vos clients
                  </span>{" "}
                  avec NutriFlow
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Votre assistant numérique tout-en-un pour diététiciens. Optimisez la gestion de vos clients, générez des plans alimentaires alimentés par l'IA, et automatisez votre pratique — le tout dans une seule belle plateforme.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  asChild
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-lg px-8 py-6"
                >
                  <Link href="/signup">
                    Commencez votre essai gratuit de 14 jours
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 bg-transparent">
                  Voir la Démo
                </Button>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Aucune carte bancaire requise</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Configuration en 5 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Annulation à tout moment</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 shadow-2xl border border-emerald-100">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <Heart className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Tableau de bord client</h3>
                        <p className="text-sm text-gray-600">Suivez les progrès en temps réel</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                        <span className="text-sm font-medium">Sarah Johnson</span>
                        <Badge className="bg-emerald-100 text-emerald-800">Sur la bonne voie</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                        <span className="text-sm font-medium">Mike Chen</span>
                        <Badge className="bg-blue-100 text-blue-800">Excellent</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                        <span className="text-sm font-medium">Emma Davis</span>
                        <Badge className="bg-purple-100 text-purple-800">En amélioration</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 blur-xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full opacity-20 blur-xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Fonctionnalités</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Tout ce dont vous avez besoin pour gérer votre pratique</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              De la gestion des clients à la planification de repas alimentée par l'IA, NutriFlow fournit tous les outils dont vous avez besoin pour offrir des soins exceptionnels tout en économisant du temps.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-8 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Gestion des clients</h3>
                <p className="text-gray-600">
                  Organisez, étiquetez et suivez facilement les progrès de vos clients avec notre tableau de bord intuitif et des profils détaillés.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-8 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Wand2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Plans alimentaires IA</h3>
                <p className="text-gray-600">
                  Générez instantanément des plans alimentaires personnalisés grâce à notre IA avancée qui prend en compte les restrictions alimentaires et les préférences.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-8 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Bell className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Rappels automatisés</h3>
                <p className="text-gray-600">
                  Ne manquez jamais un suivi ou un rendez-vous avec des notifications intelligentes par email, SMS et WhatsApp.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-8 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Receipt className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Facturation simple</h3>
                <p className="text-gray-600">
                  Gérez la facturation sans effort avec la facturation automatique, le suivi des paiements et les rapports financiers.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200">Comment ça marche</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Commencez en 3 étapes simples</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Configurer votre cabinet de nutrition numérique n'a jamais été aussi simple. Suivez ces étapes pour transformer votre flux de travail.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                  <Target className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-emerald-600">1</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">Inscrivez-vous et personnalisez</h3>
                <p className="text-gray-600">
                  Créez votre compte et personnalisez votre portail client avec votre image de marque, vos couleurs et votre message de bienvenue.
                </p>
              </div>
            </div>

            <div className="text-center space-y-6">
              <div className="relative">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">2</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">Gérez et générez</h3>
                <p className="text-gray-600">
                  Ajoutez vos clients, suivez leurs progrès et générez des plans alimentaires personnalisés grâce à notre assistant IA.
                </p>
              </div>
            </div>

            <div className="text-center space-y-6">
              <div className="relative">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <Zap className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-purple-600">3</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">Automatisez et suivez</h3>
                <p className="text-gray-600">
                  Configurez des rappels automatiques, suivez les paiements et regardez votre cabinet fonctionner en toute fluidité sur pilote automatique.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Témoignages</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Adopté par les diététiciens du monde entier</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez comment NutriFlow transforme les cabinets de nutrition et aide les diététiciens à offrir de meilleurs soins.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 space-y-6">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 italic">
                  "Si NutriFlow tient ses promesses, ça va vraiment me faire gagner du temps sur les suivis. L'idée d'automatiser les plans tout en gardant le côté humain, c'est exactement ce qu'il me fallait."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold">
                    CR
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Camille Roche</p>
                    <p className="text-sm text-gray-600">Diététicienne, Lyon</p>
                    <p className="text-xs text-emerald-600 mt-1">Inscrite sur la liste d'accès anticipé • Cabinet de 45 clients</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 space-y-6">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 italic">
                  "Si NutriFlow tient ses promesses, ça va vraiment m'aider au quotidien. J'ai hâte de pouvoir passer moins de temps sur l'administratif et plus avec mes patients."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                    ML
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Marie Leblanc</p>
                    <p className="text-sm text-gray-600">Diététicienne, Bordeaux</p>
                    <p className="text-xs text-emerald-600 mt-1">A participé aux premiers retours utilisateurs • Bordeaux</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 space-y-6">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 italic">
                  "Après avoir vu la démo, j'ai hâte de tester l'intégration avec les applis de sport ! Mes athlètes pourraient enfin avoir une approche vraiment personnalisée en fonction de leur activité."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-semibold">
                    JM
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Julien Martinez</p>
                    <p className="text-sm text-gray-600">Diététicien du sport, Nice</p>
                    <p className="text-xs text-emerald-600 mt-1">Fait partie de notre comité de bêta-testeurs • Nice</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Teaser Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-purple-50 text-purple-700 border-purple-200">Tarifs</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Commencez votre essai gratuit aujourd'hui</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Découvrez toute la puissance de NutriFlow avec notre essai gratuit de 14 jours. Aucune carte de crédit requise, pas de frais d'installation, annulation à tout moment.
              </p>
            </div>

            <Card className="border-0 shadow-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
              <CardContent className="p-12 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="h-6 w-6 text-emerald-600" />
                    <span className="text-lg font-semibold text-emerald-600">Essai gratuit de 14 jours</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Testez tout, sans risque</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Accédez à toutes les fonctionnalités incluant la planification de repas IA, la gestion des clients, les rappels automatisés et la facturation.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 max-w-md mx-auto text-left">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm text-gray-700">Clients illimités</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm text-gray-700">Planification IA des repas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm text-gray-700">Rappels automatisés</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm text-gray-700">Image de marque personnalisée</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm text-gray-700">Support prioritaire</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm text-gray-700">Pas de frais d'installation</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button
                    size="lg"
                    asChild
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-lg px-12 py-6"
                  >
                    <Link href="/signup">
                      Commencer votre essai gratuit
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <p className="text-sm text-gray-500">Aucune carte de crédit requise • Annulation à tout moment • Configuration en 5 minutes</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-sm">
                  N
                </div>
                <span className="font-bold text-xl">NutriFlow</span>
              </div>
              <p className="text-gray-400">
                Donner aux diététiciens les outils IA pour offrir des soins clients exceptionnels et développer leur cabinet.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Produit</h4>
              <div className="space-y-2 text-gray-400">
                <button
                  onClick={() => scrollToSection("features")}
                  className="block hover:text-white transition-colors"
                >
                  Fonctionnalités
                </button>
                <button onClick={() => scrollToSection("pricing")} className="block hover:text-white transition-colors">
                  Tarifs
                </button>
                <Link href="/dashboard" className="block hover:text-white transition-colors">
                  Tableau de bord
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Entreprise</h4>
              <div className="space-y-2 text-gray-400">
                <a href="#" className="block hover:text-white transition-colors">
                  À propos
                </a>
                <a href="#" className="block hover:text-white transition-colors">
                  Blog
                </a>
                <a href="#" className="block hover:text-white transition-colors">
                  Carrières
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Légal</h4>
              <div className="space-y-2 text-gray-400">
                <a href="#" className="block hover:text-white transition-colors">
                  Conditions d'utilisation
                </a>
                <a href="#" className="block hover:text-white transition-colors">
                  Politique de confidentialité
                </a>
                <a href="#" className="block hover:text-white transition-colors">
                  Politique de cookies
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2024 NutriFlow. Tous droits réservés.</p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
