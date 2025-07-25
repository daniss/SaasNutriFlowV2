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
    id: "recipes",
    title: "Création de recettes",
    description: "Guide complet pour créer et gérer vos recettes",
    icon: "ChefHat",
    color: "bg-green-500",
    articles: [
      {
        id: "create-first-recipe",
        title: "Créer votre première recette étape par étape",
        description: "Guide complet pour créer une recette de A à Z",
        content: `# Créer votre première recette

Apprenez à créer des recettes professionnelles avec calculs nutritionnels automatiques.

## Accès à la création de recettes

1. Dans la sidebar, cliquez sur **Recettes**
2. Cliquez sur **+ Nouvelle recette** en haut à droite
3. La boîte de dialogue de création s'ouvre

## Étape 1 : Informations de base

### Champs obligatoires ⭐
- **Nom de la recette** : Soyez descriptif (ex: "Salade quinoa avocat aux graines")
- **Catégorie** : Choisissez parmi :
  - Petit-déjeuner
  - Déjeuner
  - Dîner
  - Collation
  - Dessert
  - Accompagnement
  - Boisson

### Champs optionnels
- **Description** : Présentez votre recette (origine, occasion, bénéfices)
- **Temps de préparation** : En minutes
- **Temps de cuisson** : En minutes
- **Nombre de portions** : Important pour les calculs nutritionnels
- **Difficulté** : Facile, Moyen, Difficile

## Étape 2 : Ajouter les ingrédients

### Méthode 1 : Saisie manuelle
1. Dans la section "Ingrédients", remplissez :
   - **Nom** : "Quinoa"
   - **Quantité** : 100
   - **Unité** : g, ml, tasse, cuillère, pièce, etc.
2. Cliquez sur **+ Ajouter manuellement** pour un nouvel ingrédient

### Méthode 2 : Base de données interne 🔍
1. Dans "Ajouter depuis la base d'ingrédients"
2. Tapez le nom de l'ingrédient (ex: "tomate")
3. Sélectionnez dans la liste déroulante
4. L'ingrédient est ajouté avec ses valeurs nutritionnelles automatiques

### Méthode 3 : Base ANSES-CIQUAL 🏛️
1. Cliquez sur **Rechercher dans ANSES-CIQUAL**
2. Tapez votre recherche (ex: "pomme")
3. Choisissez la variété exacte
4. L'ingrédient est ajouté avec données officielles

## Étape 3 : Calculs nutritionnels automatiques

### Fonctionnement automatique
- Les valeurs se calculent en temps réel
- Basées sur les ingrédients de la base de données
- Affichées par portion selon votre paramétrage

### Valeurs calculées
- **Calories** : Total énergétique
- **Protéines** : En grammes
- **Glucides** : En grammes
- **Lipides** : En grammes
- **Fibres** : En grammes

### Correction manuelle
Si les calculs automatiques ne conviennent pas :
1. Modifiez directement les valeurs nutritionnelles
2. Vos modifications remplacent les calculs automatiques
3. Utile pour recettes complexes ou transformations culinaires

## Étape 4 : Instructions de préparation

### Ajouter les étapes
1. Dans "Instructions", décrivez chaque étape
2. Utilisez un langage clair et précis
3. Cliquez **+ Ajouter une étape** pour continuer
4. Numérotation automatique

### Conseils rédactionnels
- **Soyez précis** : "Mixer 2 minutes" plutôt que "mixer"
- **Ordre chronologique** : Respectez l'ordre de préparation
- **Techniques** : Expliquez les gestes importants
- **Temps** : Indiquez les durées (cuisson, repos...)

## Étape 5 : Tags et organisation

### Ajouter des tags
1. Tapez un mot-clé dans "Ajouter un tag"
2. Appuyez sur Entrée ou cliquez **+**
3. Exemples de tags utiles :
   - "sans gluten", "végan", "rapide"
   - "anti-inflammatoire", "riche en fer"
   - "batch cooking", "meal prep"

### Utilité des tags
- **Recherche rapide** : Retrouvez vos recettes
- **Filtrage** : Par régime alimentaire
- **Organisation** : Groupez par thèmes

## Étape 6 : Sauvegarde et utilisation

### Finaliser la recette
1. Vérifiez toutes les informations
2. Cliquez **Créer** (ou **Modifier** si édition)
3. La recette apparaît dans votre bibliothèque

### Utiliser votre recette
- **Plans alimentaires** : Intégrez-la dans vos plans
- **Templates** : Créez des modèles avec vos recettes favorites
- **Partage** : Export PDF pour vos clients

## Exemples pratiques

### Recette simple : Overnight oats
- **Ingrédients** : 50g flocons d'avoine, 150ml lait amandes, 1 c. à soupe graines de chia
- **Instructions** : Mélanger, réfrigérer toute la nuit, garnir de fruits
- **Tags** : "petit-déjeuner", "sans cuisson", "meal prep"

### Recette élaborée : Curry de lentilles
- **Ingrédients** : 15 ingrédients avec épices détaillées
- **Instructions** : 8 étapes avec temps de cuisson précis
- **Tags** : "végan", "riche en protéines", "anti-inflammatoire"

## Conseils d'organisation

### Nommage cohérent
- Utilisez une convention : "Type - Ingrédient principal - Particularité"
- Ex: "Petit-déj - Avoine - Sans sucre"

### Catégorisation
- Soyez cohérent dans vos catégories
- Adaptez aux habitudes de vos clients
- Pensez aux régimes spéciaux

### Documentation
- Notez l'origine de la recette
- Ajoutez des variantes possibles
- Indiquez les substitutions

## Dépannage courant

### "Ingrédient non trouvé"
- Vérifiez l'orthographe
- Essayez des synonymes
- Ajoutez manuellement si nécessaire

### "Calculs nutritionnels incorrects"
- Vérifiez les quantités et unités
- Contrôlez la correspondance ingrédient/base
- Corrigez manuellement si besoin

### "Recette non sauvegardée"
- Vérifiez les champs obligatoires (nom, catégorie)
- Contrôlez votre connexion internet
- Recommencez si erreur persistante

Créer des recettes de qualité est la base d'une pratique nutritionnelle efficace !`,
        category: "recipes",
        tags: ["recettes", "création", "ingrédients", "nutrition"],
        difficulty: "beginner",
        estimatedReadTime: 8,
        lastUpdated: "2024-01-25",
        views: 0,
        helpful: 0,
        featured: true
      },
      {
        id: "ingredient-database",
        title: "Maîtriser la base de données d'ingrédients",
        description: "Comment utiliser efficacement la base d'ingrédients et ANSES-CIQUAL",
        content: `# Base de données d'ingrédients

Apprenez à tirer parti des bases de données nutritionnelles pour des recettes précises.

## Vue d'ensemble des sources

### Base interne NutriFlow
- **Contenu** : Ingrédients courants pré-configurés
- **Avantages** : Recherche rapide, valeurs harmonisées
- **Usage** : Ingrédients de base fréquemment utilisés

### Base ANSES-CIQUAL 🏛️
- **Contenu** : Base officielle française (3000+ aliments)
- **Avantages** : Données scientifiques validées
- **Usage** : Recherches précises, ingrédients spécifiques

## Utiliser la base interne

### Accès et recherche
1. Dans la création de recette, section "Ingrédients"
2. Tapez dans "Rechercher un ingrédient..."
3. La liste filtrée apparaît en temps réel
4. Cliquez sur l'ingrédient souhaité

### Informations disponibles
- **Nom standardisé** : Dénomination harmonisée
- **Catégorie** : Fruits, légumes, céréales, etc.
- **Unité par défaut** : g, ml, ou pièce
- **Valeurs nutritionnelles** :
  - Calories (/100g, /100ml, /pièce)
  - Protéines, glucides, lipides, fibres

### Cas d'usage optimaux
- ✅ Ingrédients courants (tomate, riz, poulet...)
- ✅ Création rapide de recettes
- ✅ Cohérence entre vos recettes
- ❌ Ingrédients très spécifiques
- ❌ Variétés particulières

## Utiliser ANSES-CIQUAL

### Accès à la base
1. Cliquez **Rechercher dans ANSES-CIQUAL**
2. Une fenêtre de recherche s'ouvre
3. Tapez votre recherche (français uniquement)
4. Parcourez les résultats détaillés

### Comprendre les résultats
- **Codes ANSES** : Identifiant unique officiel
- **Dénomination complète** : Description précise
- **Valeurs certifiées** : Analyses en laboratoire
- **Variabilité** : Parfois plusieurs variétés

### Exemples de recherches

#### Recherche simple : "pomme"
- Pomme, pulpe et peau, crue
- Pomme, pulpe, crue
- Pomme Golden, crue
- Pomme Granny Smith, crue
➡️ Choisissez selon la variété exacte

#### Recherche complexe : "saumon"
- Saumon atlantique, cru
- Saumon atlantique, cuit à la vapeur
- Saumon fumé
- Saumon rose, cru
➡️ Mode de cuisson et espèce influencent les valeurs

### Cas d'usage optimaux
- ✅ Ingrédients spécifiques non trouvés
- ✅ Variétés particulières importantes
- ✅ Précision nutritionnelle maximale
- ✅ Recettes "signature" élaborées

## Stratégies de recherche

### Mots-clés efficaces
- **Noms courts** : "bœuf" plutôt que "viande de bœuf"
- **Termes simples** : "yaourt" plutôt que "laitage fermenté"
- **Français standard** : Évitez l'argot ou les régionalismes

### Si aucun résultat
1. **Simplifiez** : "courgette" au lieu de "courgette verte"
2. **Synonymes** : "aubergine" ou "mélongène"
3. **Catégorie** : "légumineuse" si "haricot rouge" échoue
4. **Saisie manuelle** en dernier recours

## Gestion des unités

### Unités standards
- **g (grammes)** : Solides, poudres
- **ml (millilitres)** : Liquides
- **pièce** : Fruits, œufs, tranches

### Conversions courantes
- **1 cuillère à soupe** ≈ 15ml (liquides) ou 15g (poudres)
- **1 cuillère à café** ≈ 5ml/5g
- **1 tasse** ≈ 240ml (variable selon pays)

### Conseils de précision
- Privilégiez **grammes/ml** pour la précision
- Utilisez **pièces** pour fruits/légumes entiers
- Documentez vos équivalences personnelles

## Valeurs nutritionnelles

### Données automatiques
- **Auto-calculées** selon quantité et ingrédient
- **Temps réel** : Modification instantanée
- **Par portion** : Selon nombre de parts défini

### Comprendre les variations
- **Mode de cuisson** : Cru vs cuit change les valeurs
- **Variété** : Une pomme Granny ≠ une Golden
- **Saisonnalité** : Compositions variables

### Vérification manuelle
Si les valeurs semblent incorrectes :
1. Vérifiez l'ingrédient sélectionné
2. Contrôlez les quantités et unités
3. Comparez avec sources externes si doute
4. Ajustez manuellement si nécessaire

## Bonnes pratiques

### Organisation de vos recherches
- **Favoris** : Notez vos ingrédients récurrents
- **Standards** : Définissez vos ingrédients "par défaut"
- **Documentation** : Tenez un référentiel personnel

### Cohérence professionnelle
- **Même source** : Utilisez la même base pour ingrédients similaires
- **Standardisation** : "Tomate" toujours de la même façon
- **Traçabilité** : Notez la source en cas de question client

### Cas particuliers
- **Aliments transformés** : Ajout manuel souvent nécessaire
- **Mélanges d'épices** : Détaillez ou estimez
- **Plats cuisinés** : Recréez la recette complète

Maîtriser ces outils vous permettra de créer des recettes nutritionnellement précises et professionnelles !`,
        category: "recipes",
        tags: ["base de données", "ANSES", "CIQUAL", "ingrédients", "nutrition"],
        difficulty: "intermediate",
        estimatedReadTime: 12,
        lastUpdated: "2024-01-25",
        views: 0,
        helpful: 0,
        featured: true
      }
    ]
  },
  {
    id: "meal-planning",
    title: "Plans alimentaires & IA",
    description: "Création de plans manuels, IA et gestion des templates",
    icon: "Utensils",
    color: "bg-orange-500",
    articles: [
      {
        id: "manual-meal-plan",
        title: "Créer un plan alimentaire manuel complet",
        description: "Guide étape par étape pour créer des plans personnalisés",
        content: `# Création d'un plan alimentaire manuel

Apprenez à créer des plans alimentaires personnalisés de A à Z.

## Accès à la création de plans

1. Dans la sidebar, cliquez sur **Plans alimentaires**
2. Cliquez sur **+ Nouveau plan** 
3. Choisissez **Création manuelle** (vs IA ou Template)

## Étape 1 : Configuration de base

### Informations obligatoires
- **Nom du plan** : Descriptif et unique (ex: "Plan perte de poids - Marie J.")
- **Client** : Sélectionnez dans votre liste de clients
- **Durée** : Nombre de jours (1 à 14 recommandé)
- **Objectif** : Maintenance, perte de poids, prise de poids, performance

### Paramètres avancés
- **Nombre de repas/jour** : 3 à 6 repas
- **Inclure collations** : Oui/Non
- **Style alimentaire** : Équilibré, méditerranéen, végétarien, etc.
- **Calories cibles** : Auto-calculées ou manuelles

## Étape 2 : Structure du plan

### Répartition des repas
- **Petit-déjeuner** : 20-25% des calories
- **Déjeuner** : 30-35% des calories  
- **Dîner** : 25-30% des calories
- **Collations** : 10-20% des calories

### Organisation par jour
1. Le plan affiche une grille : Jours × Repas
2. Chaque case = un repas à remplir
3. Navigation fluide entre jours et repas

## Étape 3 : Ajouter des recettes aux repas

### Méthode 1 : Depuis votre bibliothèque
1. Cliquez sur une case repas vide
2. **Rechercher recettes** s'ouvre
3. Parcourez vos recettes par :
   - Catégorie (petit-déjeuner, déjeuner...)
   - Mots-clés (quinoa, végétarien...)
   - Favorites
4. Cliquez sur la recette souhaitée

### Méthode 2 : Création à la volée
1. Dans la case repas, cliquez **+ Créer recette**
2. La fenêtre de création s'ouvre
3. Créez votre recette (voir guide recettes)
4. Elle s'ajoute automatiquement au repas

### Méthode 3 : Repas simple
1. Cliquez **Repas simple** au lieu de recette
2. Listez directement les aliments :
   - 100g riz basmati
   - 120g saumon grillé
   - 200g courgettes vapeur
3. Calculs nutritionnels automatiques

## Étape 4 : Ajuster portions et nutrition

### Modifier les portions
1. Cliquez sur une recette dans le plan
2. Ajustez le **nombre de portions**
3. Les valeurs nutritionnelles se recalculent

### Équilibrage nutritionnel
- **Visualisation** : Graphiques par jour et total
- **Répartition** : % protéines/glucides/lipides
- **Objectifs** : Voyant vert/rouge selon cibles

### Ajustements courants
- **Trop de calories** : Réduire portions ou remplacer
- **Pas assez** : Ajouter collation ou augmenter portions
- **Déséquilibré** : Modifier recettes ou ajouter compléments

## Étape 5 : Ajouter des jours

### Extension du plan
1. En bas du plan, cliquez **+ Ajouter jour**
2. Le jour suivant apparaît vide
3. Remplissez comme les jours précédents

### Copier des jours
1. Cliquez **⋯** sur un jour rempli
2. Sélectionnez **Dupliquer**
3. Choisissez le jour de destination
4. Modifiez ensuite selon besoins

### Rotation de menus
- Créez 3-4 jours types
- Dupliquez-les en alternance
- Variez les accompagnements

## Étape 6 : Personnalisation avancée

### Notes et conseils
1. Cliquez sur **Notes** en haut du plan
2. Ajoutez :
   - Instructions spécifiques
   - Conseils de préparation
   - Adaptations possibles
   - Points d'attention

### Liste de courses automatique
1. Le système génère automatiquement
2. Regroupe tous les ingrédients
3. Organisée par rayon (fruits, viandes...)
4. Quantités calculées selon portions

## Cas d'usage types

### Plan perte de poids (1400 kcal)
- **Petit-déjeuner** : 300 kcal (avoine, fruits, yaourt)
- **Déjeuner** : 450 kcal (protéine, légumes, féculent)
- **Collation** : 150 kcal (fruits, oléagineux)
- **Dîner** : 400 kcal (léger, légumes++)
- **Hydratation** : 1,5-2L eau

### Plan sportif (2500 kcal)
- **Petit-déjeuner** : 500 kcal (consistant)
- **Collation pré-training** : 200 kcal (glucides)
- **Déjeuner** : 700 kcal (équilibré)
- **Collation post-training** : 300 kcal (protéines)
- **Dîner** : 600 kcal
- **Collation soir** : 200 kcal si besoin

### Plan végétarien équilibré
- **Focus** : Associations protéiques (légumineuses + céréales)
- **Attention** : B12, fer, zinc, oméga-3
- **Variété** : Rotation légumineuses, graines, noix

## Conseils d'efficacité

### Préparation en amont
- **Templates** : Créez des structures de base
- **Recettes fétiches** : Constituez votre bibliothèque
- **Saisonnalité** : Adaptez selon les saisons

### Workflow optimisé
1. **Structure** d'abord (répartition calories)
2. **Protéines** ensuite (base de chaque repas)
3. **Légumes** pour le volume
4. **Féculents** pour l'énergie
5. **Matières grasses** pour l'équilibre

### Gestion du temps
- **Batch cooking** : Intégrez dans vos plans
- **Préparations** : Notez temps de prep total
- **Simplicité** : Alternez complexe/simple

## Dépannage courant

### "Plan déséquilibré"
- Vérifiez la répartition des macronutriments
- Ajustez les portions plutôt que changer recettes
- Utilisez les collations pour équilibrer

### "Calories incorrectes"
- Contrôlez les portions de chaque recette
- Vérifiez les calculs des recettes individuelles
- Recalculez si modifications d'ingrédients

### "Trop complexe à préparer"
- Simplifiez certains repas
- Intégrez plus de "repas simples"
- Planifiez batch cooking dans les notes

Créer des plans manuels vous donne un contrôle total sur la nutrition de vos clients !`,
        category: "meal-planning",
        tags: ["plan alimentaire", "manuel", "nutrition", "personnalisation"],
        difficulty: "intermediate",
        estimatedReadTime: 15,
        lastUpdated: "2024-01-25",
        views: 0,
        helpful: 0,
        featured: true
      },
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
        lastUpdated: "2024-01-25",
        views: 987,
        helpful: 89,
        featured: true
      },
      {
        id: "templates-usage",
        title: "Utiliser et créer des templates de plans",
        description: "Gagnez du temps avec les templates de plans alimentaires",
        content: `# Templates de plans alimentaires

Maîtrisez les templates pour créer rapidement des plans professionnels.

## Qu'est-ce qu'un template ?

### Définition
- **Plan type** réutilisable pour situations similaires
- **Structure pré-définie** avec recettes et proportions
- **Personnalisable** selon client spécifique
- **Gain de temps** considérable

### Types de templates
- **Personnels** : Vos créations privées
- **Partagés** : Templates communautaires
- **Catégories** : Par objectif, style alimentaire, durée

## Utiliser un template existant

### Accès aux templates
1. **Plans alimentaires** > **+ Nouveau plan**
2. Sélectionnez **À partir d'un template**
3. Parcourez les catégories disponibles

### Parcourir les templates
- **Filtres** : Objectif, durée, style alimentaire
- **Aperçu** : Prévisualisation avant utilisation
- **Évaluations** : Notes et commentaires communautaires
- **Recherche** : Par mots-clés

### Appliquer un template
1. Sélectionnez le template souhaité
2. **Aperçu détaillé** avec structure complète
3. Cliquez **Utiliser ce template**
4. Choisissez le client destinataire
5. Le plan se crée avec tous les repas pré-remplis

## Personnaliser un template

### Adaptations courantes
- **Portions** : Ajuster selon besoins caloriques client
- **Substitutions** : Remplacer selon allergies/préférences
- **Jours** : Ajouter/supprimer selon durée souhaitée
- **Repas** : Modifier ou remplacer certains repas

### Workflow de personnalisation
1. **Appliquer** le template de base
2. **Analyser** la répartition nutritionnelle
3. **Ajuster** les portions si nécessaire
4. **Substituer** les aliments problématiques
5. **Ajouter** notes personnalisées

## Créer vos propres templates

### À partir d'un plan existant
1. Ouvrez un plan alimentaire réussi
2. Cliquez **⋯** > **Créer template**
3. Configurez les paramètres :
   - **Nom** descriptif
   - **Description** détaillée
   - **Catégorie** appropriée
   - **Visibilité** (privé/partagé)

### Configuration du template
- **Nom** : "Plan perte de poids méditerranéen 7j"
- **Description** : Objectifs, public cible, spécificités
- **Tags** : Mots-clés pour retrouver facilement
- **Catégorie** : Perte de poids, équilibré, sport...

### Bonnes pratiques création
- **Flexibilité** : Plans adaptables facilement
- **Documentation** : Instructions d'utilisation claires
- **Équilibre** : Nutrition optimisée
- **Variété** : Éviter monotonie alimentaire

## Catégories de templates

### Par objectif
- **Perte de poids** : 1200-1500 kcal, déficit modéré
- **Prise de masse** : 2500-3000 kcal, surplus protéique
- **Maintenance** : Équilibre énergétique
- **Performance** : Adaptation entraînements

### Par style alimentaire
- **Méditerranéen** : Oméga-3, antioxydants, olive
- **Végétarien** : Associations protéiques optimisées
- **Low-carb** : <100g glucides/jour
- **Anti-inflammatoire** : Aliments anti-oxydants

### Par durée
- **3 jours** : Détox, remise en route
- **7 jours** : Standard hebdomadaire
- **14 jours** : Rotation complète menus

## Gestion de vos templates

### Organisation
- **Nommage cohérent** : Convention standardisée
- **Dossiers** : Classement par thème
- **Favoris** : Templates les plus utilisés
- **Archivage** : Templates obsolètes

### Mise à jour
- **Révision régulière** : Actualiser selon évolutions
- **Feedback clients** : Intégrer retours d'expérience
- **Nouvelles recettes** : Enrichir avec créations récentes
- **Saisonnalité** : Adapter aux saisons

## Templates communautaires

### Partager vos créations
1. Template > **Paramètres** > **Rendre public**
2. Complétez description détaillée
3. Ajoutez instructions d'utilisation
4. La communauté peut l'évaluer

### Utiliser templates partagés
- **Évaluations** : Notations et commentaires
- **Adaptations** : Historique modifications
- **Auteur** : Profil du créateur
- **Téléchargements** : Popularité

## Exemples de templates efficaces

### "Détox 3 jours" (1300 kcal)
- **J1** : Smoothies verts, salades, légumes vapeur
- **J2** : Jus de légumes, quinoa, poisson blanc
- **J3** : Fruits, légumineuses, tisanes
- **Usage** : Remise en forme post-excès

### "Sportif endurance 7j" (2800 kcal)
- **Pré-effort** : Glucides complexes
- **Post-effort** : Protéines + glucides
- **Récupération** : Anti-inflammatoires
- **Usage** : Marathoniens, cyclistes

### "Végétarien équilibré 14j" (2000 kcal)
- **Associations** : Légumineuses + céréales
- **B12** : Complémentation prévue
- **Fer** : Sources optimisées
- **Usage** : Transition ou maintenance végétarienne

## Conseils d'efficacité

### Stratégie templates
- **Créez** 5-6 templates de base
- **Couvrez** vos cas clients fréquents
- **Personnalisez** systématiquement
- **Documentez** vos adaptations

### Optimisation workflow
1. **Template** comme base (80% du travail)
2. **Personnalisation** rapide (15% du temps)
3. **Finalisation** et notes (5% du temps)
4. **Gain** : 70% de temps sur création complète

Les templates transforment votre efficacité en consultation tout en maintenant la qualité !`,
        category: "meal-planning",
        tags: ["templates", "modèles", "efficiency", "réutilisation"],
        difficulty: "intermediate",
        estimatedReadTime: 12,
        lastUpdated: "2024-01-25",
        views: 0,
        helpful: 0,
        featured: false
      }
    ]
  },
  {
    id: "pdf-export",
    title: "Export PDF & Partage",
    description: "Générer des PDFs professionnels et partager avec vos clients",
    icon: "FileText",
    color: "bg-purple-500",
    articles: [
      {
        id: "pdf-export-guide",
        title: "Exporter vos plans en PDF professionnel",
        description: "Guide complet pour générer des PDFs de qualité",
        content: `# Export PDF professionnel

Créez des documents PDF de qualité pour vos clients avec toutes les options de personnalisation.

## Accès aux exports PDF

### Depuis un plan alimentaire
1. Ouvrez le plan alimentaire souhaité
2. Cliquez sur **Export PDF** en haut à droite
3. Choisissez le type d'export désiré

### Types d'export disponibles
- **PDF complet** : Plan + conseils + liste de courses
- **Plan seulement** : Menus sans liste de courses
- **Liste de courses** : Ingrédients uniquement
- **Résumé nutritionnel** : Analyses et graphiques

## Configuration de l'export

### Options de contenu
- ✅ **Informations client** : Nom, objectifs, dates
- ✅ **Plan jour par jour** : Tous les repas détaillés
- ✅ **Valeurs nutritionnelles** : Par repas et totaux
- ✅ **Liste de courses** : Groupée par rayons
- ✅ **Conseils personnalisés** : Vos recommandations
- ❌ **Recettes détaillées** : Instructions de préparation

### Personnalisation visuelle
- **Logo** : Votre logo professionnel en en-tête
- **Couleurs** : Charte graphique personnalisée
- **Coordonnées** : Vos informations de contact
- **Signature** : Cachet professionnel

## Structure du PDF complet

### Page 1 : En-tête professionnel
- **Votre logo** et informations cabinet
- **Titre du plan** personnalisé
- **Informations client** : Nom, dates, objectifs
- **Résumé** : Durée, calories/jour, style alimentaire

### Pages 2-N : Plan détaillé
- **Organisation par jour** : Pagination claire
- **Chaque repas** : Nom, ingrédients, portions
- **Valeurs nutritionnelles** : Par repas
- **Notes** : Conseils spécifiques par jour

### Page finale : Synthèse
- **Analyses nutritionnelles** : Graphiques et moyennes
- **Liste de courses** : Par catégories d'aliments
- **Conseils généraux** : Hydratation, préparation, conservation
- **Contact** : Pour questions et suivi

## Optimiser la présentation

### Mise en page professionnelle
- **Espacement** : Aération optimale
- **Typographie** : Lisible et élégante
- **Hiérarchie** : Titres et sous-titres clairs
- **Couleurs** : Harmonieuses et professionnelles

### Contenu client-friendly
- **Langage accessible** : Éviter jargon technique
- **Portions pratiques** : Équivalences visuelles
- **Instructions claires** : Préparation simplifiée
- **Motivation** : Messages encourageants

## Gestion des recettes dans le PDF

### Niveau de détail
- **Nom et portions** : Toujours affiché
- **Ingrédients** : Liste complète avec quantités
- **Instructions** : Simplifiées (2-3 étapes max)
- **Temps** : Préparation et cuisson

### Recettes complexes
- **Simplification** : Instructions essentielles
- **Renvoi** : "Recette détaillée en annexe"
- **Alternatives** : Suggestions de substitution
- **Niveau** : Indication difficulté

## Liste de courses optimisée

### Organisation par rayons
- **Fruits et légumes** : Frais de saison
- **Boucherie/Poissonnerie** : Viandes et poissons
- **Épicerie** : Conserves, huiles, épices
- **Produits laitiers** : Fromages, yaourts
- **Surgelés** : Légumes, poissons
- **Boulangerie** : Pains spéciaux

### Informations pratiques
- **Quantités totales** : Pour toute la durée
- **Conseils achat** : Fraîcheur, saisonnalité
- **Conservation** : Durées et conditions
- **Budget** : Estimation coûts

## Personnalisation avancée

### Votre identité visuelle
1. **Paramètres** > **Profil** > **Branding**
2. Uploadez votre logo (format PNG/JPG)
3. Définissez vos couleurs principales
4. Configurez vos coordonnées

### Templates de PDF
- **Classique** : Mise en page standard
- **Moderne** : Design épuré contemporain
- **Coloré** : Avec accents de couleur
- **Minimaliste** : Focus sur le contenu

### Messages personnalisés
- **Mot d'accueil** : Message de motivation
- **Conseils spécifiques** : Selon profil client
- **Coordonnées** : Contact et urgences
- **Prochaine consultation** : Date et objectifs

## Workflow d'export optimal

### Préparation en amont
1. **Vérification** : Relire le plan complet
2. **Personnalisation** : Ajouter notes spécifiques
3. **Validation** : Confirmer équilibre nutritionnel
4. **Branding** : Vérifier logo et coordonnées

### Export et contrôle
1. **Génération** : Lancer l'export (30-60 secondes)
2. **Prévisualisation** : Contrôler le rendu
3. **Ajustements** : Corriger si nécessaire
4. **Export final** : Télécharger le PDF

### Post-export
1. **Vérification** : Ouvrir et parcourir le PDF
2. **Sauvegarde** : Archiver dans dossier client
3. **Envoi** : Email ou remise en consultation
4. **Suivi** : Programmer rappel de suivi

## Partage avec les clients

### Envoi par email
1. **Export** > **Envoyer par email**
2. Email pré-rempli avec votre signature
3. Objet personnalisé automatiquement
4. PDF en pièce jointe

### Portail client
- **Upload automatique** : PDF accessible 24h/24
- **Historique** : Tous les plans consultables
- **Notifications** : Alerte nouveau plan
- **Comments** : Retours clients possibles

### Remise en consultation
- **Impression** : Qualité professionnelle
- **Reliure** : Présentation soignée
- **Explication** : Passage en revue ensemble
- **Questions** : Clarifications immédiates

## Bonnes pratiques

### Qualité professionnelle
- **Relecture** : Zéro faute d'orthographe
- **Cohérence** : Respect de votre charte graphique
- **Complétude** : Toutes informations nécessaires
- **Lisibilité** : Test sur différents supports

### Relation client
- **Accompagnement** : Ne pas juste envoyer le PDF
- **Explication** : Détailler la logique du plan
- **Disponibilité** : Pour questions ultérieures
- **Suivi** : Programmer le prochain point

### Archivage
- **Nomenclature** : "Nom_Client_Date_Type.pdf"
- **Dossiers** : Organisation par client
- **Versions** : Numérotation si modifications
- **Sauvegarde** : Backup régulier

Les PDFs de qualité renforcent votre crédibilité et facilitent l'application du plan par vos clients !`,
        category: "pdf-export",
        tags: ["PDF", "export", "professionnel", "clients"],
        difficulty: "beginner",
        estimatedReadTime: 10,
        lastUpdated: "2024-01-25",
        views: 0,
        helpful: 0,
        featured: true
      }
    ]
  },
  {
    id: "workflows",
    title: "Flux de travail complets",
    description: "Workflows end-to-end de la recette au plan alimentaire",
    icon: "BarChart3",
    color: "bg-blue-500",
    articles: [
      {
        id: "complete-workflow",
        title: "Workflow complet : De la recette au plan client",
        description: "Guide end-to-end pour maîtriser tout le processus",
        content: `# Workflow complet : De la recette au plan client

Maîtrisez le processus complet de création d'un plan alimentaire professionnel.

## Vue d'ensemble du workflow

### Étapes principales
1. **Création recettes** : Bibliothèque personnelle
2. **Profil client** : Objectifs et contraintes
3. **Conception plan** : Manuel, IA ou template
4. **Personnalisation** : Ajustements spécifiques
5. **Export PDF** : Document professionnel
6. **Partage client** : Consultation et suivi

### Temps estimé
- **Première fois** : 2-3 heures (apprentissage)
- **Avec expérience** : 30-60 minutes
- **Avec templates** : 15-30 minutes

## Phase 1 : Préparer sa bibliothèque de recettes

### Stratégie de création
1. **Recettes de base** : 20-30 recettes polyvalentes
2. **Par catégorie** : 5-8 par type de repas
3. **Niveaux de difficulté** : Facile à élaboré
4. **Styles alimentaires** : Selon votre patientèle

### Recettes indispensables
- **Petit-déjeuner** : Rapides et nutritifs
  - Overnight oats variés
  - Smoothies protéinés
  - Œufs préparés différemment
  
- **Déjeuners** : Équilibrés et rassasiants
  - Salades complètes
  - Bowl healthy
  - Plats uniques légumes-protéines-féculents
  
- **Dîners** : Plus légers
  - Soupes nutritives
  - Poissons grillés
  - Légumes farcis

### Workflow création recette
1. **Inspiration** : Client, saison, objectif
2. **Base ANSES** : Ingrédients précis
3. **Test** : Validation personnelle si possible
4. **Documentation** : Instructions claires
5. **Tags** : Classification efficace

## Phase 2 : Analyser le profil client

### Collecte d'informations
- **Anthropométrie** : Poids, taille, âge, sexe
- **Activité physique** : Type, fréquence, intensité
- **Objectifs** : Perte, prise, maintenance, performance
- **Contraintes** : Allergies, intolérances, aversions
- **Style de vie** : Horaires, budget, compétences culinaires

### Calculs préliminaires
- **Métabolisme de base** : Formule Harris-Benedict
- **Besoins énergétiques** : Activité physique intégrée
- **Répartition macro** : Selon objectifs
- **Contraintes particulières** : Pathologies éventuelles

## Phase 3 : Concevoir le plan

### Choix de la méthode

#### Option A : Création manuelle
**Quand l'utiliser** :
- Cas complexes (pathologies)
- Contraintes très spécifiques
- Contrôle total souhaité

**Processus** :
1. Structure de base (jours/repas)
2. Répartition calorique par repas
3. Sélection recettes adaptées
4. Ajustement portions
5. Vérification équilibre

#### Option B : Génération IA
**Quand l'utiliser** :
- Cas standards
- Gain de temps
- Base de départ pour personnalisation

**Processus** :
1. Paramétrage complet
2. Génération automatique
3. Révision critique
4. Ajustements personnalisés
5. Validation finale

#### Option C : Template
**Quand l'utiliser** :
- Situations récurrentes
- Efficacité maximale
- Plans "testés et approuvés"

**Processus** :
1. Sélection template approprié
2. Adaptation portions/calories
3. Substitutions si nécessaire
4. Personnalisation notes
5. Contrôle final

## Phase 4 : Personnaliser et ajuster

### Vérifications obligatoires
- **Équilibre nutritionnel** : Graphiques harmonieux
- **Calories totales** : Conformes aux objectifs
- **Répartition macro** : Selon recommandations
- **Variété alimentaire** : Éviter monotonie
- **Faisabilité** : Adapté au style de vie

### Ajustements fréquents
- **Portions** : Selon appétit et objectifs
- **Substitutions** : Allergies/intolérances
- **Simplifications** : Niveau culinaire client
- **Budget** : Alternatives économiques
- **Temps** : Préparations rapides si besoin

### Personnalisation avancée
- **Notes quotidiennes** : Conseils spécifiques
- **Préparations** : Batch cooking suggéré
- **Hydratation** : Rappels adaptés
- **Activité physique** : Recommandations complémentaires

## Phase 5 : Export et finalisation

### Préparation du document
1. **Relecture complète** : Cohérence et qualité
2. **Ajout conseils** : Notes personnalisées
3. **Vérification branding** : Logo et coordonnées
4. **Test export** : Prévisualisation

### Configuration PDF
- **Contenu complet** : Plan + liste + conseils
- **Présentation professionnelle** : Mise en page soignée
- **Informations pratiques** : Portions, substitutions
- **Contact** : Disponibilité pour questions

## Phase 6 : Consultation et remise

### Présentation du plan
1. **Contexte** : Rappel objectifs et contraintes
2. **Logique** : Explication des choix nutritionnels
3. **Parcours** : Présentation jour par jour
4. **Conseils** : Points d'attention spécifiques
5. **Questions** : Clarifications et ajustements

### Formation du client
- **Lecture du plan** : Comment l'interpréter
- **Liste de courses** : Organisation et timing
- **Préparations** : Techniques et astuces
- **Adaptations** : Flexibilité autorisée

### Suivi programmé
- **Première semaine** : Contact intermédiaire
- **Bilan 15 jours** : Ajustements si nécessaires
- **Consultation suivante** : Évolution et adaptations

## Cas pratiques détaillés

### Cas 1 : Perte de poids (Marie, 35 ans)
**Profil** : Sédentaire, 75kg, objectif -8kg
**Méthode** : Template "Perte de poids équilibré"
**Adaptations** : Réduction portions, ajout légumes
**Suivi** : Consultation hebdomadaire premiers temps

### Cas 2 : Sportif (Thomas, 28 ans)
**Profil** : Crossfit 5x/semaine, prise de masse
**Méthode** : Création manuelle
**Spécificités** : Timing protéines, glucides pré/post effort
**Suivi** : Adaptation selon performances

### Cas 3 : Végétarienne (Sophie, 42 ans)
**Profil** : Transition récente, craintes carences
**Méthode** : IA + personnalisation extensive
**Focus** : Associations protéiques, B12, fer
**Formation** : Session cuisine légumineuses

## Optimisation du workflow

### Gains d'efficacité
- **Templates** : 80% du temps de création
- **Recettes favorites** : Sélection rapide
- **Profils types** : Paramètres pré-configurés
- **Raccourcis** : Fonctions les plus utilisées

### Automation possible
- **Calculs nutritionnels** : Automatiques
- **Génération PDF** : En un clic
- **Envoi client** : Emails pré-formatés
- **Rappels** : Alertes de suivi

### Évolution continue
- **Feedback clients** : Intégration retours
- **Nouvelles recettes** : Enrichissement bibliothèque
- **Formations** : Mise à jour connaissances
- **Outils** : Exploitation nouvelles fonctionnalités

## Checklist qualité

### Avant export
- [ ] Calories conformes aux objectifs
- [ ] Équilibre nutritionnel respecté
- [ ] Contraintes alimentaires prises en compte
- [ ] Variété suffisante sur la période
- [ ] Instructions claires et réalisables
- [ ] Notes personnalisées ajoutées
- [ ] Logo et coordonnées à jour

### Avant remise client
- [ ] Relecture complète effectuée
- [ ] PDF test généré et vérifié
- [ ] Questions anticipées préparées
- [ ] Prochaine consultation planifiée
- [ ] Support de suivi prévu

Ce workflow complet vous permet de créer des plans alimentaires professionnels de manière systématique et efficace !`,
        category: "workflows",
        tags: ["workflow", "end-to-end", "processus", "efficacité"],
        difficulty: "advanced",
        estimatedReadTime: 20,
        lastUpdated: "2024-01-25",
        views: 0,
        helpful: 0,
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