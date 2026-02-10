# Secu-Planning - SAAS Multi-Agences

Application SAAS de gestion de plannings pour agences de sécurité privée, construite avec Next.js 16, Supabase et Stripe.

## 🚀 Fonctionnalités

### Multi-tenant
- **Isolation complète des données** par organisation avec Row Level Security (RLS)
- Chaque agence a ses propres agents, sites et plannings
- Authentification sécurisée avec Supabase Auth

### Gestion de Planning
- Planificateur hebdomadaire interactif pour les admins
- Assignation des missions aux agents
- Détection des conflits de disponibilité
- Vue planning pour les agents (semaine/mois)
- Export CSV des heures travaillées

### Gestion des Utilisateurs
- 3 rôles : Owner, Admin, Agent
- Gestion des agents et sites clients
- Déclaration de disponibilités pour les agents
- Système d'invitation d'équipe

### Abonnements & Paiements
- Intégration Stripe pour les paiements
- 2 plans : Standard (49€/mois) et Premium (99€/mois)
- 14 jours d'essai gratuit
- Gestion des abonnements via Stripe Customer Portal
- Quotas par plan (agents/sites limités)

## 📋 Prérequis

- Node.js 18+ et pnpm
- Un compte Supabase (gratuit)
- Un compte Stripe (mode test)

## 🛠️ Installation

### 1. Installer les dépendances

```bash
pnpm install
```

### 2. Configuration Supabase

#### A. Créer un projet Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Noter l'URL du projet et les clés API

#### B. Exécuter le schéma SQL

1. Dans Supabase Dashboard, aller dans **SQL Editor**
2. Copier le contenu de `supabase-schema.sql`
3. Exécuter le script

Cela va créer :
- Les tables (organizations, user_profiles, sites, shifts, availabilities)
- Les politiques RLS (Row Level Security)
- Les index pour la performance
- Les triggers pour `updated_at`

### 3. Configuration Stripe

#### A. Obtenir les clés Stripe

1. Aller sur [dashboard.stripe.com](https://dashboard.stripe.com)
2. En mode test, récupérer :
   - Clé publique : `pk_test_...`
   - Clé secrète : `sk_test_...`

#### B. Configurer le webhook Stripe

1. Dans Stripe Dashboard : **Developers → Webhooks**
2. Créer un endpoint avec l'URL : `http://localhost:3000/api/webhooks/stripe` (pour dev)
3. Sélectionner les événements :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copier le **Signing secret** : `whsec_...`

### 4. Variables d'environnement

Compléter `.env.local` avec vos vraies clés :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🏃 Lancer l'application

```bash
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## 🧪 Tester l'application

### 1. Flow d'inscription complet

1. Aller sur `/signup`
2. Remplir les informations :
   - **Organisation** : Nom de l'agence, email, etc.
   - **Compte admin** : Vos informations personnelles
   - **Plan** : Choisir Standard ou Premium
3. Être redirigé vers Stripe Checkout
4. Utiliser une carte de test : `4242 4242 4242 4242`
5. Après paiement, être redirigé vers l'app

### 2. Tester les fonctionnalités admin

1. Se connecter avec le compte créé
2. **Profils** :
   - Ajouter des agents (respecte les limites du plan)
   - Ajouter des sites clients
3. **Planning** :
   - Créer des missions pour les agents
   - Supprimer des missions
   - Voir les agents indisponibles (triangle rouge)
4. **Settings → Team** :
   - Inviter d'autres admins
5. **Settings → Billing** :
   - Voir l'abonnement actuel
   - Tester le changement de plan

### 3. Tester les fonctionnalités agent

1. Créer un compte agent via Profils
2. Se déconnecter et se reconnecter avec l'email de l'agent
3. **Planning** :
   - Voir uniquement ses propres missions
   - Vue semaine/mois
   - Détails des missions avec adresses
4. **Heures** :
   - Voir les statistiques du mois
   - Export CSV
5. **Disponibilités** :
   - Déclarer ses disponibilités pour le mois suivant
   - Toggle jour disponible/indisponible

### 4. Tester l'isolation multi-tenant

1. Créer une 2ème organisation (nouveau signup)
2. Vérifier que les données sont complètement isolées
3. Chaque organisation ne voit que ses propres agents/sites/plannings

## 🚀 Déploiement sur Vercel

### 1. Préparer le repository

```bash
git init
git add .
git commit -m "Initial commit - Secu-Planning SAAS"
git remote add origin votre-repo-git
git push -u origin main
```

### 2. Déployer sur Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Importer votre repository
3. Configurer les **variables d'environnement** (copier depuis `.env.local`)
4. Déployer

### 3. Configurer le webhook Stripe en production

1. Dans Stripe Dashboard, créer un nouveau webhook
2. URL : `https://votre-domaine.vercel.app/api/webhooks/stripe`
3. Même événements que pour dev
4. Copier le nouveau signing secret
5. Mettre à jour `STRIPE_WEBHOOK_SECRET` dans Vercel

### 4. Mettre à jour l'URL de l'app

Dans Vercel, mettre à jour :
```env
NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app
```

## 🔒 Sécurité

### Row Level Security (RLS)

Toutes les tables utilisent RLS pour garantir l'isolation des données :
- Les agents ne voient que leurs propres shifts
- Les admins ne voient que les données de leur organisation
- Les requêtes sont automatiquement filtrées par `organization_id`

### Authentification

- Mots de passe hashés par Supabase Auth
- Sessions sécurisées avec JWT
- Middleware Next.js pour protéger les routes

## 📊 Architecture

```
Frontend (Next.js 16)
    ↓
Supabase (PostgreSQL + Auth + RLS)
    ↓
Stripe (Paiements + Webhooks)
```

### Tables principales

- `organizations` : Agences de sécurité
- `user_profiles` : Profils utilisateurs (liés à Supabase Auth)
- `sites` : Sites clients
- `shifts` : Missions/plannings
- `availabilities` : Disponibilités des agents

### Flux d'inscription

1. Utilisateur remplit le formulaire → création compte Supabase Auth
2. Redirection vers Stripe Checkout
3. Paiement réussi → Webhook Stripe
4. Webhook crée l'organisation + lie le user
5. Utilisateur redirigé vers l'app

## 🎨 Stack Technique

- **Framework** : Next.js 16 (App Router)
- **UI** : React 19, Tailwind CSS, shadcn/ui
- **Backend** : Supabase (PostgreSQL + Auth + Storage)
- **Paiements** : Stripe (Checkout + Customer Portal)
- **Déploiement** : Vercel
- **Language** : TypeScript

## 📝 Plans et limites

| Plan | Prix | Agents | Sites | Fonctionnalités |
|------|------|--------|-------|-----------------|
| **Standard** | 49€/mois | 20 max | 50 max | Planning, Export CSV, Support email |
| **Premium** | 99€/mois | Illimité | Illimité | Tout Standard + Export PDF + Support prioritaire |

## 🐛 Debugging

### Problème de connexion
- Vérifier que l'email existe dans Supabase Auth
- Vérifier que le user_profile est créé

### Webhook Stripe ne fonctionne pas
- Vérifier le signing secret
- Regarder les logs dans Stripe Dashboard → Webhooks
- Vérifier les logs Vercel/console

### Données non isolées
- Vérifier que les RLS policies sont activées
- Vérifier que `organization_id` est bien passé dans les requêtes

## 📚 Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)

## 📄 License

MIT

## 👤 Auteur

Développé pour DAOU - Application de gestion de planning pour agences de sécurité privée.

---

**Note** : Cette application est un SAAS complet avec authentification, paiements et isolation multi-tenant. Pour toute question ou problème, consulter la documentation ou créer une issue.
