# 🚀 Guide de Configuration Complet - Secu-Planning

Ce guide vous accompagne étape par étape pour configurer et lancer votre application SAAS.

## ✅ Checklist Rapide

- [ ] Node.js 18+ installé
- [ ] pnpm installé (`npm install -g pnpm`)
- [ ] Compte Supabase créé
- [ ] Compte Stripe créé
- [ ] `.env.local` configuré
- [ ] Base de données initialisée
- [ ] Webhook Stripe configuré

---

## Étape 1 : Installation des Dépendances

```bash
cd c:\Users\lenovo\Desktop\DAOU
pnpm install
```

**✅ Vérification** : Aucune erreur dans la console

---

## Étape 2 : Configuration Supabase

### 2.1 Créer le Projet

1. Aller sur https://supabase.com
2. Cliquer sur **"New Project"**
3. Choisir un nom : `secu-planning` (ou autre)
4. Choisir une région proche (Europe West par exemple)
5. Créer un mot de passe fort pour la base de données
6. Attendre que le projet soit créé (~2 minutes)

### 2.2 Récupérer les Clés

1. Dans le dashboard Supabase, aller dans **Settings → API**
2. Copier ces valeurs :
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI...
   service_role key: eyJhbGciOiJIUzI... (cliquer sur "Reveal")
   ```

### 2.3 Créer le Schéma de Base de Données

1. Dans Supabase Dashboard, aller dans **SQL Editor**
2. Cliquer sur **"New Query"**
3. Ouvrir le fichier `supabase-schema.sql` depuis votre projet
4. Copier TOUT le contenu
5. Le coller dans l'éditeur SQL
6. Cliquer sur **"Run"** (en bas à droite)
7. Attendre le message de succès : **"Success. No rows returned"**

**✅ Vérification** : 
- Aller dans **Table Editor**
- Vous devez voir 5 tables : `organizations`, `user_profiles`, `sites`, `shifts`, `availabilities`

---

## Étape 3 : Configuration Stripe

### 3.1 Créer le Compte

1. Aller sur https://dashboard.stripe.com
2. Créer un compte
3. **IMPORTANT** : Rester en **Mode Test** (toggle en haut à droite)

### 3.2 Récupérer les Clés API

1. Dans Dashboard Stripe, aller dans **Developers → API keys**
2. Copier :
   ```
   Publishable key: pk_test_...
   Secret key: sk_test_... (cliquer sur "Reveal")
   ```

### 3.3 Configurer le Webhook

**Pour le développement local :**

1. Aller dans **Developers → Webhooks**
2. Cliquer sur **"Add endpoint"**
3. Remplir :
   - **Endpoint URL** : `http://localhost:3000/api/webhooks/stripe`
   - **Description** : `Local development webhook`
   - **Events to send** : Cliquer sur **"Select events"**
     - Cocher : `checkout.session.completed`
     - Cocher : `customer.subscription.updated`
     - Cocher : `customer.subscription.deleted`
     - Cocher : `invoice.payment_succeeded`
     - Cocher : `invoice.payment_failed`
4. Cliquer sur **"Add endpoint"**
5. Sur la page du webhook, copier le **Signing secret** : `whsec_...`

---

## Étape 4 : Configuration des Variables d'Environnement

1. Ouvrir le fichier `.env.local` à la racine du projet
2. Remplacer les valeurs par vos vraies clés :

```env
# Supabase (depuis Étape 2.2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (depuis Étape 3.2 et 3.3)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App (laisser pour le dev local)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Sauvegarder le fichier

**✅ Vérification** : Toutes les lignes commençant par `your-` ou `xxx` doivent être remplacées

---

## Étape 5 : Lancer l'Application

```bash
pnpm dev
```

**Vous devriez voir :**
```
   ▲ Next.js 16.1.6
   - Local:        http://localhost:3000
   - Environments: .env.local

 ✓ Ready in 2.5s
```

**✅ Vérification** : Ouvrir http://localhost:3000 dans votre navigateur

---

## Étape 6 : Test Complet du Flow

### 6.1 Inscription

1. Aller sur http://localhost:3000
2. Cliquer sur **"Créer votre compte"** (ou aller sur `/signup`)
3. Remplir le formulaire en 3 étapes :

**Étape 1 - Organisation :**
```
Nom de l'agence: Test Security
Email: test@security.fr
Téléphone: 01 23 45 67 89
```

**Étape 2 - Admin :**
```
Prénom: Jean
Nom: Dupont
Email: jean.dupont@security.fr
Mot de passe: test123456
```

**Étape 3 - Plan :**
- Sélectionner **Premium** ou **Standard**

4. Cliquer sur **"Procéder au paiement"**

### 6.2 Paiement Stripe (Mode Test)

1. Sur la page Stripe Checkout, utiliser ces données de test :
   ```
   Email: test@example.com
   Numéro de carte: 4242 4242 4242 4242
   Date d'expiration: 12/34
   CVC: 123
   Nom: Test User
   ```

2. Cliquer sur **"Subscribe"**

3. **IMPORTANT** : Vous devriez être redirigé vers `http://localhost:3000`

### 6.3 Vérifier dans Supabase

1. Aller dans Supabase Dashboard → **Table Editor**
2. Cliquer sur `organizations` : vous devez voir 1 ligne
3. Cliquer sur `user_profiles` : vous devez voir 1 ligne avec `role = 'owner'`

### 6.4 Vérifier dans Stripe

1. Aller dans Stripe Dashboard → **Customers**
2. Vous devez voir un nouveau client : "Test Security"
3. Aller dans **Subscriptions** : vous devez voir 1 abonnement actif en "trialing"

### 6.5 Tester les Fonctionnalités

**En tant qu'Admin :**

1. **Ajouter un agent** :
   - Aller dans "Profils"
   - Cliquer sur "Ajouter un agent"
   - Remplir le formulaire
   - Vérifier qu'il apparaît dans la liste

2. **Ajouter un site** :
   - Dans "Profils", onglet "Sites"
   - Ajouter un site client

3. **Créer une mission** :
   - Aller dans "Planificateur"
   - Cliquer sur une cellule (agent × jour)
   - Remplir le formulaire
   - Vérifier que la mission apparaît

4. **Inviter un admin** :
   - Aller dans Settings → Team
   - Inviter un nouveau membre avec le rôle "Admin"

5. **Gérer l'abonnement** :
   - Aller dans Settings → Billing
   - Cliquer sur "Gérer l'abonnement"
   - Vous serez redirigé vers Stripe Customer Portal

**En tant qu'Agent :**

1. Se déconnecter
2. Se reconnecter avec l'email de l'agent créé
3. **Planning** : voir uniquement ses missions
4. **Heures** : voir ses statistiques
5. **Disponibilités** : déclarer ses disponibilités

---

## Étape 7 : Tester l'Isolation Multi-Tenant

1. Ouvrir une **fenêtre de navigation privée**
2. Aller sur http://localhost:3000/signup
3. Créer une **deuxième organisation** (autre nom, autre email)
4. Vérifier que :
   - Les 2 organisations ne voient pas les données l'une de l'autre
   - Chaque organisation a ses propres agents/sites/plannings

---

## 🐛 Résolution des Problèmes

### Erreur : "Supabase URL not configured"
➡️ Vérifier que `.env.local` est bien à la racine et contient les bonnes clés

### Erreur : "Webhook signature verification failed"
➡️ Vérifier que `STRIPE_WEBHOOK_SECRET` correspond au webhook créé

### Erreur : "No organization found" après signup
➡️ Vérifier que :
1. Le webhook Stripe est bien configuré
2. Le SQL schema a été exécuté sans erreur
3. Les logs du webhook dans Stripe Dashboard → Webhooks

### Impossible de se connecter
➡️ Vérifier dans Supabase → Authentication → Users que l'utilisateur existe

### Les données ne se chargent pas
➡️ Ouvrir la console du navigateur (F12) et vérifier les erreurs

---

## 🚀 Déploiement en Production

Une fois que tout fonctionne en local, suivre le guide dans `README.md` section "Déploiement sur Vercel".

**Points clés :**
1. Créer un nouveau webhook Stripe pour l'URL de production
2. Mettre à jour toutes les variables d'environnement dans Vercel
3. Tester le flow complet sur l'URL de production

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifier les logs de la console (F12)
2. Vérifier les logs Supabase (Logs → Query logs)
3. Vérifier les logs Stripe (Developers → Webhooks → votre webhook)

---

**Félicitations ! 🎉** Votre application SAAS est maintenant configurée et prête à l'emploi.
