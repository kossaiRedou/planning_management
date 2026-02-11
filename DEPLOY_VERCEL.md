# 🚀 Guide de Déploiement sur Vercel

## Étapes de Déploiement

### Étape 1 : Initialiser Git et Push

```powershell
# Dans votre dossier DAOU
cd c:\Users\lenovo\Desktop\DAOU

# Initialiser git
git init

# Ajouter tous les fichiers
git add .

# Créer le premier commit
git commit -m "Initial commit - Secu-Planning SAAS"

# Créer un repository sur GitHub
# Aller sur github.com → New repository → Créer "secu-planning"

# Lier votre repo local à GitHub (remplacer par votre username)
git remote add origin https://github.com/VOTRE-USERNAME/secu-planning.git

# Pousser le code
git branch -M main
git push -u origin main
```

---

### Étape 2 : Déployer sur Vercel

1. **Aller sur** https://vercel.com
2. **Se connecter** avec GitHub
3. Cliquer sur **"Add New..."** → **"Project"**
4. **Importer** votre repository `secu-planning`
5. Vercel détectera automatiquement Next.js

---

### Étape 3 : Configurer les Variables d'Environnement

**IMPORTANT** : Avant de déployer, configurez les variables d'environnement !

Dans Vercel, section **"Environment Variables"**, ajouter :

**⚠️ IMPORTANT : Copier les vraies valeurs depuis votre fichier .env.local (ne pas utiliser les exemples ci-dessous)**

```env
NEXT_PUBLIC_SUPABASE_URL=votre-url-supabase.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_votre-cle
STRIPE_SECRET_KEY=sk_test_votre-cle
STRIPE_WEBHOOK_SECRET=whsec_sera-genere-apres-creation-webhook

NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app
```

**Comment faire :**
1. Ouvrir votre fichier `.env.local` local
2. Copier chaque valeur UNE PAR UNE dans Vercel
3. Pour chaque variable, cocher "Production", "Preview", et "Development"

**⚠️ Attention** :
- Pour chaque variable, sélectionner **"Production", "Preview", et "Development"**
- `NEXT_PUBLIC_APP_URL` sera votre URL Vercel (vous le saurez après le déploiement)

---

### Étape 4 : Déployer

1. Cliquer sur **"Deploy"**
2. Attendre 2-3 minutes
3. Une fois déployé, noter votre URL : `https://secu-planning-xxx.vercel.app`

---

### Étape 5 : Mettre à jour NEXT_PUBLIC_APP_URL

1. Dans Vercel, aller dans **Settings → Environment Variables**
2. Trouver `NEXT_PUBLIC_APP_URL`
3. Le modifier avec votre vraie URL Vercel : `https://secu-planning-xxx.vercel.app`
4. **Redéployer** : Aller dans Deployments → cliquer sur les 3 points → Redeploy

---

### Étape 6 : Configurer le Webhook Stripe avec l'URL Vercel

**Maintenant que vous avez une URL publique !**

1. Retourner dans **Stripe Dashboard → Developers → Webhooks**
2. Cliquer sur **"+ Ajouter une destination"**
3. **URL d'endpoint** :
   ```
   https://votre-app.vercel.app/api/webhooks/stripe
   ```
   ⚠️ Remplacer par votre vraie URL Vercel

4. Sélectionner les 5 événements (comme avant)
5. Cliquer sur **"Ajouter l'endpoint"**
6. **Copier le "Secret de signature"** : `whsec_...`

---

### Étape 7 : Ajouter le Webhook Secret dans Vercel

1. Dans Vercel → **Settings → Environment Variables**
2. Modifier `STRIPE_WEBHOOK_SECRET` avec le vrai secret : `whsec_...`
3. **Redéployer** une dernière fois

---

## ✅ Test Final

1. Aller sur votre URL Vercel : `https://votre-app.vercel.app`
2. Cliquer sur **"Créer un compte"**
3. Remplir le formulaire d'inscription
4. Payer avec la carte de test : `4242 4242 4242 4242`
5. **Cette fois le webhook fonctionnera !** 🎉
6. Vous serez redirigé et pourrez vous connecter

---

## 💡 Avantages de cette méthode

✅ **URL publique HTTPS** → Webhooks fonctionnent  
✅ **Déploiement gratuit** sur Vercel  
✅ **CI/CD automatique** (push git = redéploiement auto)  
✅ **Performance optimale** avec edge functions  
✅ **Facile à partager** avec des clients  

---

## 🆘 Si vous avez des problèmes

**Je suis là pour vous aider !** Dites-moi à quelle étape vous bloquez :
- Création du repo GitHub ?
- Configuration Vercel ?
- Variables d'environnement ?
- Webhook Stripe ?

Voulez-vous que je vous guide étape par étape ? 😊
