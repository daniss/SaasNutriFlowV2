export interface HelpArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number; // in minutes
  lastUpdated: string;
  views?: number;
  helpful?: number;
  featured?: boolean;
}

export interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  articles: HelpArticle[];
}

export const helpContent: HelpCategory[] = [
  {
    id: "getting-started",
    title: "Premiers pas",
    description: "Configuration initiale et tour d'horizon de l'interface",
    icon: "Book",
    color: "bg-blue-500",
    articles: [
      {
        id: "welcome-tour",
        title: "Bienvenue sur NutriFlow - Tour d'horizon",
        description: "Découvrez les principales fonctionnalités de votre tableau de bord",
        content: `# Bienvenue sur NutriFlow !

Félicitations ! Vous venez de rejoindre NutriFlow, la plateforme tout-en-un pour les diététiciens-nutritionnistes.

## Vue d'ensemble du tableau de bord

Votre tableau de bord est organisé autour de plusieurs sections principales :

### 🏠 Tableau de bord
Votre page d'accueil avec les statistiques importantes :
- Nombre de clients actifs
- Rendez-vous du jour
- Plans alimentaires récents
- Revenus du mois

### 👥 Clients
Gérez tous vos clients en un seul endroit :
- Créer de nouveaux profils clients
- Suivre l'évolution (poids, mesures, photos)
- Gérer les documents et dossiers médicaux
- Historique des consultations

### 🍽️ Plans alimentaires
Créez des plans personnalisés :
- Générateur IA avec Google Gemini
- Templates réutilisables
- Export PDF professionnel
- Analyses nutritionnelles

### 📅 Rendez-vous
Planifiez vos consultations :
- Calendrier intégré
- Rappels automatiques
- Gestion des créneaux
- Synchronisation avec votre agenda

### ⚙️ Paramètres
Configurez votre compte :
- Profil professionnel
- Sécurité (2FA)
- Préférences
- Facturation

## Navigation

La sidebar gauche vous permet d'accéder rapidement à toutes les fonctionnalités. Elle se réduit automatiquement sur mobile et s'étend au survol sur desktop.

## Actions rapides

Utilisez les boutons d'actions rapides pour :
- Générer un plan avec l'IA
- Ajouter un nouveau client
- Créer un rendez-vous

## Prochaines étapes

1. **Complétez votre profil** dans les Paramètres
2. **Créez votre premier client** 
3. **Explorez le générateur de plans IA**
4. **Configurez l'authentification à deux facteurs**

Besoin d'aide ? Notre équipe support est disponible via le bouton "Aide & Support" de la sidebar.`,
        category: "getting-started",
        tags: ["démarrage", "interface", "navigation"],
        difficulty: "beginner",
        estimatedReadTime: 5,
        lastUpdated: "2024-01-15",
        views: 1543,
        helpful: 142,
        featured: true
      },
      {
        id: "profile-setup",
        title: "Configurer votre profil professionnel",
        description: "Paramétrez vos informations professionnelles et préférences",
        content: `# Configuration de votre profil professionnel

Un profil complet inspire confiance à vos clients et améliore votre visibilité.

## Accéder aux paramètres du profil

1. Cliquez sur **Paramètres** dans la sidebar
2. Sélectionnez l'onglet **Profil**

## Informations essentielles

### Informations personnelles
- **Nom et prénom** : Utilisés sur les documents et factures
- **Email** : Votre adresse de contact principale
- **Téléphone** : Pour les urgences et prises de RDV

### Informations professionnelles
- **Titre professionnel** : Diététicien(ne)-nutritionniste, Nutritionniste...
- **Numéro ADELI** : Votre numéro d'identification professionnel
- **Années d'expérience** : Affiché sur votre profil public
- **Bio professionnelle** : Présentez votre approche et spécialités

### Adresse du cabinet
- **Adresse complète** : Utilisée pour les factures et documents
- **Ville et code postal** : Pour la géolocalisation
- **Informations complémentaires** : Étage, interphone, etc.

## Photo de profil

Ajoutez une photo professionnelle :
1. Cliquez sur l'avatar dans les paramètres
2. Sélectionnez une image (format JPG/PNG, max 2MB)
3. Recadrez si nécessaire
4. Sauvegardez

**Conseils :**
- Photo récente et de qualité
- Arrière-plan neutre
- Tenue professionnelle
- Sourire bienveillant

## Préférences

### Langue et région
- **Langue** : Français (par défaut)
- **Fuseau horaire** : Automatiquement détecté
- **Format de date** : DD/MM/YYYY (Europe)

### Notifications
Configurez vos alertes :
- Nouveaux messages clients
- Rendez-vous à venir
- Rappels de suivi
- Mises à jour système

## Visibilité

Choisissez ce qui est visible pour vos clients :
- ✅ Nom et titre professionnel
- ✅ Photo de profil
- ✅ Bio professionnelle
- ✅ Années d'expérience
- ❌ Numéro ADELI (privé)
- ❌ Adresse complète (optionnel)

## Sauvegarde

N'oubliez pas de cliquer sur **Enregistrer** après vos modifications !

## Dépannage

**Problème de téléchargement de photo ?**
- Vérifiez la taille (max 2MB)
- Utilisez un format JPG ou PNG
- Assurez-vous d'avoir une connexion stable

**Erreur de sauvegarde ?**
- Vérifiez tous les champs obligatoires
- Contactez le support si le problème persiste`,
        category: "getting-started",
        tags: ["profil", "configuration", "paramètres"],
        difficulty: "beginner",
        estimatedReadTime: 3,
        lastUpdated: "2024-01-10",
        views: 892,
        helpful: 78
      }
    ]
  },
  {
    id: "security",
    title: "Sécurité & Authentification",
    description: "Configuration de la sécurité et authentification à deux facteurs",
    icon: "Shield",
    color: "bg-red-500",
    articles: [
      {
        id: "two-factor-auth",
        title: "Configurer l'authentification à deux facteurs (2FA)",
        description: "Sécurisez votre compte avec l'authentification TOTP",
        content: `# Authentification à deux facteurs (2FA)

L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire à votre compte en demandant un code généré par votre téléphone en plus de votre mot de passe.

## Pourquoi activer la 2FA ?

- **Sécurité renforcée** : Même si votre mot de passe est compromis, votre compte reste protégé
- **Protection des données clients** : Conformité RGPD et protection des données sensibles
- **Tranquillité d'esprit** : Soyez alerté en cas de tentative de connexion suspecte

## Applications recommandées

Téléchargez une de ces applications sur votre smartphone :

### 📱 Google Authenticator
- **iOS** : [App Store](https://apps.apple.com/app/google-authenticator/id388497605)
- **Android** : [Google Play](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2)
- ✅ Gratuit, simple d'utilisation
- ✅ Fonctionne hors ligne

### 📱 Authy
- **iOS** : [App Store](https://apps.apple.com/app/authy/id494168017)
- **Android** : [Google Play](https://play.google.com/store/apps/details?id=com.authy.authy)
- ✅ Sauvegarde cloud
- ✅ Multi-appareils

### 📱 1Password
- **iOS** : [App Store](https://apps.apple.com/app/1password-password-manager/id568903335)
- **Android** : [Google Play](https://play.google.com/store/apps/details?id=com.onepassword.android)
- ✅ Gestionnaire de mots de passe intégré
- 💰 Payant

## Configuration étape par étape

### Étape 1 : Accéder aux paramètres de sécurité

1. Connectez-vous à NutriFlow
2. Cliquez sur **Paramètres** dans la sidebar
3. Sélectionnez l'onglet **Sécurité**
4. Trouvez la section "Authentification à deux facteurs"

### Étape 2 : Activer la 2FA

1. Cliquez sur **Ajouter facteur** 
2. Une fenêtre s'ouvre avec un QR code

### Étape 3 : Scanner le QR code

1. Ouvrez votre application d'authentification
2. Cliquez sur **+** ou **Ajouter un compte**
3. Scannez le QR code affiché sur votre écran
4. Un compte "NutriFlow" apparaît dans votre app

### Étape 4 : Vérifier la configuration

1. Dans votre app, notez le code à 6 chiffres pour NutriFlow
2. Saisissez ce code dans le champ "Code de vérification"
3. Cliquez sur **Vérifier et activer**

### Étape 5 : Codes de récupération

⚠️ **IMPORTANT** : Sauvegardez vos codes de récupération !

1. Notez les codes de récupération affichés
2. Stockez-les dans un endroit sûr (coffre-fort numérique)
3. Ces codes vous permettront d'accéder à votre compte si vous perdez votre téléphone

## Utilisation quotidienne

### Connexion avec 2FA

1. Saisissez votre email et mot de passe habituel
2. Cliquez sur **Se connecter**
3. Une nouvelle page demande le code 2FA
4. Ouvrez votre app d'authentification
5. Saisissez le code à 6 chiffres
6. Cliquez sur **Vérifier**

### Codes de récupération

Si vous n'avez pas accès à votre téléphone :
1. Cliquez sur "J'ai perdu mon téléphone" sur la page 2FA
2. Saisissez un de vos codes de récupération
3. Reconfigurez immédiatement la 2FA avec votre nouveau téléphone

## Gestion des facteurs

### Ajouter un deuxième facteur

Recommandé pour plus de sécurité :
1. Allez dans **Paramètres > Sécurité**
2. Cliquez sur **Ajouter facteur**
3. Suivez les mêmes étapes avec une autre app ou un autre appareil

### Supprimer un facteur

⚠️ Attention : Cette action est irréversible
1. Dans la liste des facteurs configurés
2. Cliquez sur l'icône de suppression (poubelle)
3. Entrez votre code 2FA pour confirmer
4. Le facteur est immédiatement supprimé

## Dépannage

### "Code invalide" lors de la configuration
- Vérifiez que l'heure de votre téléphone est correcte
- Rescannez le QR code
- Essayez avec une autre app d'authentification

### "J'ai perdu mon téléphone"
- Utilisez un code de récupération
- Contactez le support si vous n'avez plus vos codes
- Préparez une pièce d'identité pour vérification

### "L'app ne génère plus de codes"
- Vérifiez l'heure de votre téléphone
- Redémarrez l'application
- Re-synchronisez si l'option existe

### "Je ne retrouve plus mes codes de récupération"
- Connectez-vous normalement avec votre 2FA
- Allez dans **Paramètres > Sécurité**
- Générez de nouveaux codes de récupération
- Sauvegardez-les immédiatement

## Bonnes pratiques

### ✅ À faire
- Testez votre 2FA après configuration
- Sauvegardez vos codes de récupération dans un gestionnaire de mots de passe
- Configurez la 2FA sur plusieurs appareils
- Mettez à jour vos codes de récupération régulièrement

### ❌ À éviter
- Partager vos codes avec qui que ce soit
- Stocker les codes de récupération sur votre téléphone
- Désactiver la 2FA sur un réseau public
- Ignorer les alertes de sécurité

## Support

Besoin d'aide ? Notre équipe support est disponible :
- **Email** : support@nutriflow.fr
- **Chat** : Bouton d'aide dans l'application
- **Téléphone** : +33 1 XX XX XX XX (heures ouvrables)

La sécurité de vos données et celles de vos clients est notre priorité absolue !`,
        category: "security",
        tags: ["2FA", "sécurité", "authentification", "TOTP"],
        difficulty: "intermediate",
        estimatedReadTime: 8,
        lastUpdated: "2024-01-12",
        views: 1234,
        helpful: 156,
        featured: true
      }
    ]
  },
  {
    id: "meal-planning",
    title: "Plans alimentaires & IA",
    description: "Utilisation du générateur IA et création de plans personnalisés",
    icon: "Utensils",
    color: "bg-orange-500",
    articles: [
      {
        id: "ai-generator",
        title: "Créer votre premier plan alimentaire avec l'IA",
        description: "Guide complet pour utiliser le générateur IA Google Gemini",
        content: `# Générateur de plans alimentaires IA

Notre générateur IA utilise Google Gemini pour créer des plans alimentaires personnalisés en quelques minutes.

## Accès au générateur

1. Dans la sidebar, cliquez sur **Plans alimentaires**
2. Cliquez sur **Générer avec IA** ou utilisez l'action rapide ⚡

## Étape 1 : Informations client

### Données obligatoires
- **Âge** : Pour calculer les besoins énergétiques
- **Sexe** : Différences métaboliques homme/femme
- **Poids actuel** : Base du calcul calorique
- **Taille** : Calcul de l'IMC
- **Niveau d'activité** : Sédentaire à très actif

### Données optionnelles
- **Poids objectif** : Pour les plans de perte/prise de poids
- **Allergies alimentaires** : Éviction automatique
- **Intolérances** : Lactose, gluten, FODMAP...
- **Préférences** : Végétarien, végan, sans porc...
- **Aliments détestés** : À éviter dans les suggestions

## Étape 2 : Paramètres du plan

### Durée et structure
- **Nombre de jours** : 1 à 14 jours
- **Nombre de repas** : 3 à 6 repas par jour
- **Collations** : Inclure ou non les en-cas

### Objectifs nutritionnels
- **Maintenance** : Maintien du poids actuel
- **Perte de poids** : Déficit calorique modéré (-500 kcal/jour)
- **Prise de poids** : Surplus calorique (+300-500 kcal/jour)
- **Sport/Performance** : Adaptation aux entraînements

### Style alimentaire
- **Équilibré** : Recommandations PNNS
- **Méditerranéen** : Riche en oméga-3 et antioxydants
- **Low-carb** : Réduction des glucides
- **Hyperprotéiné** : Pour la prise de masse
- **Anti-inflammatoire** : Aliments riches en antioxydants

## Étape 3 : Génération

1. Vérifiez tous les paramètres
2. Cliquez sur **Générer le plan**
3. L'IA analyse les données (30-60 secondes)
4. Le plan apparaît avec :
   - Menu détaillé jour par jour
   - Calculs nutritionnels automatiques
   - Liste de courses générée
   - Conseils personnalisés

## Étape 4 : Personnalisation

### Modifier un repas
1. Cliquez sur un repas dans le plan
2. **Remplacer** : L'IA propose des alternatives
3. **Modifier les portions** : Ajuster les quantités
4. **Ajouter/Supprimer** des aliments

### Ajuster les calories
- **Trop élevé** : Réduire les portions ou remplacer par des alternatives moins caloriques
- **Trop faible** : Ajouter des collations ou augmenter les portions

### Équilibrer les nutriments
- Vérifiez les % de protéines/glucides/lipides
- L'IA respecte les recommandations nutritionnelles
- Ajustez si besoins spécifiques (sport, pathologie...)

## Étape 5 : Finalisation

### Prévisualisation PDF
1. Cliquez sur **Aperçu PDF**
2. Vérifiez la mise en page
3. Personnalisez l'en-tête avec votre logo

### Export et partage
- **PDF complet** : Plan + conseils + liste de courses
- **PDF simplifié** : Menus uniquement
- **Envoi email** : Directement au client
- **Portail client** : Accessible dans son espace personnel

## Conseils d'utilisation

### ✅ Bonnes pratiques
- Complétez au maximum le profil client
- Vérifiez toujours le plan avant envoi
- Personnalisez avec vos recommandations
- Expliquez le plan lors de la consultation

### ⚠️ Points d'attention
- L'IA donne des suggestions, vous restez responsable
- Adaptez selon les pathologies spécifiques
- Vérifiez les interactions médicamenteuses
- Surveillez la tolérance digestive

### 🔄 Itération
- Ajustez selon les retours clients
- Régénérez si besoin avec nouveaux paramètres
- Sauvegardez les versions qui fonctionnent bien
- Créez des templates pour vos cas fréquents

## Exemples d'utilisation

### Plan perte de poids (femme, 35 ans)
- **Profil** : 70kg, 165cm, sédentaire
- **Objectif** : -5kg en 3 mois
- **Calories** : 1400 kcal/jour
- **Répartition** : 25% protéines, 45% glucides, 30% lipides

### Plan sportif (homme, 28 ans)
- **Profil** : 80kg, 180cm, très actif (musculation)
- **Objectif** : Prise de masse
- **Calories** : 2800 kcal/jour
- **Focus** : Protéines post-entraînement

### Plan méditerranéen (senior, 65 ans)
- **Profil** : Prévention cardiovasculaire
- **Style** : Méditerranéen riche en oméga-3
- **Spécificités** : Peu de sel, beaucoup de légumes

## Dépannage

### "Génération échouée"
- Vérifiez votre connexion internet
- Réduisez le nombre de contraintes
- Contactez le support si persistant

### "Plan trop restrictif"
- Augmentez les calories cibles
- Réduisez les exclusions alimentaires
- Choisissez "Équilibré" comme style

### "Erreur de calcul"
- Vérifiez les données anthropométriques
- Recalculez avec les bonnes unités
- Contactez le support pour signaler le bug

L'IA est un outil puissant qui vous fait gagner du temps tout en gardant votre expertise au centre de la prise en charge !`,
        category: "meal-planning",
        tags: ["IA", "générateur", "Gemini", "plan alimentaire"],
        difficulty: "intermediate",
        estimatedReadTime: 10,
        lastUpdated: "2024-01-08",
        views: 987,
        helpful: 89,
        featured: true
      }
    ]
  }
];

// Search functionality
export function searchArticles(query: string, categories?: string[]): HelpArticle[] {
  if (!query.trim()) return [];
  
  const searchTerms = query.toLowerCase().split(' ');
  const allArticles = helpContent.flatMap(cat => 
    categories && categories.length > 0 && !categories.includes(cat.id) 
      ? [] 
      : cat.articles
  );
  
  return allArticles.filter(article => {
    const searchableText = [
      article.title,
      article.description,
      article.content,
      ...article.tags
    ].join(' ').toLowerCase();
    
    return searchTerms.every(term => searchableText.includes(term));
  }).sort((a, b) => {
    // Prioritize featured articles
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    
    // Then by views
    return (b.views || 0) - (a.views || 0);
  });
}

// Get article by ID
export function getArticleById(id: string): HelpArticle | null {
  for (const category of helpContent) {
    const article = category.articles.find(a => a.id === id);
    if (article) return article;
  }
  return null;
}

// Get category by ID
export function getCategoryById(id: string): HelpCategory | null {
  return helpContent.find(cat => cat.id === id) || null;
}

// Get popular articles
export function getPopularArticles(limit: number = 5): HelpArticle[] {
  const allArticles = helpContent.flatMap(cat => cat.articles);
  return allArticles
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, limit);
}

// Get featured articles
export function getFeaturedArticles(): HelpArticle[] {
  const allArticles = helpContent.flatMap(cat => cat.articles);
  return allArticles.filter(article => article.featured);
}