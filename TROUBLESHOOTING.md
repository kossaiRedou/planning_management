# 🔍 Guide de Dépannage - Secu-Planning

## Problème actuel : Chargement infini

### Symptôme
La page affiche "Chargement..." infiniment sans jamais afficher la page de connexion ou le dashboard.

---

## 🔄 Flux complet de l'application

### 1. **Page d'accueil (`/`)**
```
app/page.tsx
  └─> AuthProvider (lib/auth-context.tsx)
       ├─> useEffect: initialise la session
       │    ├─> getSession()
       │    └─> Si session existe → fetchUserProfile()
       │
       └─> AppContent
            ├─> Si isLoading = true → Affiche "Chargement..."
            ├─> Si user = null → Affiche LoginPage
            └─> Si user existe → Affiche Dashboard (Admin ou Agent)
```

**Point de friction #1** : Si `isLoading` ne passe jamais à `false`, l'utilisateur reste bloqué sur "Chargement..."

---

### 2. **Flux d'inscription (`/signup`)**
```
1. Utilisateur remplit le formulaire
2. Crée une session Stripe Checkout
3. Paiement sur Stripe
4. Webhook Stripe appelé (/api/webhooks/stripe)
   ├─> Crée l'utilisateur dans Supabase Auth
   ├─> Crée l'organisation
   └─> Crée le profil utilisateur
5. Redirection vers /signup/success
6. Redirection vers /login
```

**Point de friction #2** : Si le webhook échoue, l'utilisateur Auth existe mais pas le profil → Chargement infini

---

### 3. **Flux de connexion (`/login`)**
```
1. Utilisateur entre email + mot de passe
2. login() appelé
   ├─> signInWithPassword()
   ├─> fetchUserProfile()
   │    ├─> Récupère user_profiles
   │    └─> Récupère organizations
   └─> Si succès → redirection vers /
3. Sur / → AppContent affiche le dashboard
```

**Point de friction #3** : Si `fetchUserProfile()` échoue (profil inexistant ou RLS bloque), `user` reste `null`

---

## 🐛 Points de friction identifiés

### **Problème A : Profil utilisateur manquant**

**Cause** : Le webhook Stripe n'a pas créé le profil utilisateur dans la table `user_profiles`

**Symptômes** :
- Connexion réussit (Supabase Auth)
- Mais chargement infini ou erreur "profil introuvable"

**Vérification** :
```sql
-- Dans Supabase SQL Editor
SELECT * FROM auth.users WHERE email = 'votre@email.com';
-- Notez l'ID utilisateur

SELECT * FROM user_profiles WHERE id = 'ID_UTILISATEUR';
-- Si aucun résultat → Le profil n'existe pas !
```

**Solution** :
1. Vérifier les logs Vercel du webhook
2. Créer manuellement le profil si nécessaire

---

### **Problème B : RLS (Row Level Security) bloque l'accès**

**Cause** : Les policies RLS empêchent l'utilisateur de lire son propre profil

**Symptômes** :
- Console du navigateur : `Error code: 42501 - permission denied`
- Chargement infini

**Vérification** :
```sql
-- Vérifier les policies RLS
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
```

**Solution** : Vérifier que la policy permet à l'utilisateur de lire son propre profil :
```sql
-- Policy correcte pour user_profiles
CREATE POLICY "Users can view their own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);
```

---

### **Problème C : Session Supabase corrompue**

**Cause** : Cookie de session invalide dans le navigateur

**Symptômes** :
- Chargement infini dès l'ouverture de la page
- Même après avoir vidé le cache

**Solution** :
1. Ouvrir la console du navigateur (F12)
2. Aller dans l'onglet "Application" ou "Stockage"
3. Supprimer tous les cookies pour `planning-management.vercel.app`
4. Supprimer le localStorage et sessionStorage
5. Recharger la page

---

### **Problème D : Variables d'environnement manquantes sur Vercel**

**Cause** : Les clés Supabase ne sont pas configurées sur Vercel

**Symptômes** :
- Erreurs dans les logs Vercel
- L'application ne peut pas se connecter à Supabase

**Vérification** : Dans Vercel → Settings → Environment Variables, vérifier que ces variables existent :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`

---

## 🔧 Solutions rapides

### Solution 1 : Vider complètement le cache du navigateur

```
1. F12 → Application → Storage
2. Supprimer tous les cookies
3. Clear localStorage
4. Clear sessionStorage
5. F5 (recharger)
```

### Solution 2 : Créer manuellement le profil utilisateur

```sql
-- 1. Récupérer l'ID de l'utilisateur
SELECT id, email FROM auth.users WHERE email = 'votre@email.com';

-- 2. Récupérer l'ID de l'organisation
SELECT id, name FROM organizations ORDER BY created_at DESC LIMIT 1;

-- 3. Créer le profil
INSERT INTO user_profiles (id, organization_id, first_name, last_name, role)
VALUES (
  'USER_ID_FROM_STEP_1',
  'ORG_ID_FROM_STEP_2',
  'Votre',
  'Nom',
  'owner'
);
```

### Solution 3 : Déconnecter l'utilisateur et réessayer

```javascript
// Dans la console du navigateur sur https://planning-management.vercel.app/
localStorage.clear();
sessionStorage.clear();
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
location.reload();
```

---

## 📊 Logs de débogage

### Dans la console du navigateur, vous devriez voir :

**Séquence normale** :
```
Initializing auth...
No existing session found
Auth initialization complete, setting isLoading to false
```

**Si session existe** :
```
Initializing auth...
Found existing session for user: xxx-xxx-xxx
Fetching profile for user: xxx-xxx-xxx
Profile found: {...}
Organization found: {...}
Setting user data: {...}
Auth initialization complete, setting isLoading to false
```

**Si erreur** :
```
Initializing auth...
Found existing session for user: xxx-xxx-xxx
Fetching profile for user: xxx-xxx-xxx
Error fetching profile: {...}
Failed to fetch profile on mount: {...}
Auth initialization complete, setting isLoading to false
```

---

## 🆘 Si rien ne fonctionne

**Créez un nouveau compte de test** :
1. Videz complètement le cache
2. Allez sur `/signup`
3. Créez un nouveau compte avec un email différent
4. Complétez le paiement
5. Vérifiez dans Supabase que le profil est créé
6. Essayez de vous connecter

**Si le nouveau compte fonctionne**, le problème vient de votre ancien compte (profil manquant).

---

## 📞 Besoin d'aide ?

Envoyez-moi :
1. **Capture d'écran** de la console du navigateur (F12)
2. **Capture d'écran** de Supabase → Table Editor → `user_profiles`
3. **Capture d'écran** de Supabase → Authentication → Users
4. **Logs Vercel** du webhook Stripe si disponibles

Cela me permettra de diagnostiquer exactement le problème !
