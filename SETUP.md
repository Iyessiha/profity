# Configuration de ProfityX

## 1. Variables d'Environnement Supabase

Vous avez une nouvelle base de données Supabase. Configurez ces variables:

### Configuration Locale (`.env.local`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://...

# GeniusPay
GENIUSPAY_API_KEY=your-geniuspay-api-key
GENIUSPAY_SECRET_KEY=your-geniuspay-secret-key
GENIUSPAY_WEBHOOK_SECRET=your-webhook-secret

# JWT
JWT_SECRET=your-jwt-secret-at-least-32-chars

# Brevo (Email)
BREVO_API_KEY=your-brevo-api-key
```

### Configuration Vercel

1. Allez à `https://vercel.com/dashboard`
2. Sélectionnez votre projet `profity`
3. Cliquez sur **Settings** → **Environment Variables**
4. Ajoutez chaque variable (voir liste ci-dessus)
5. Assurez-vous que les variables sont disponibles pour:
   - ✓ Production
   - ✓ Preview
   - ✓ Development

## 2. Obtenir les Valeurs

### Depuis Supabase:

1. Allez à [supabase.com](https://supabase.com)
2. Connectez-vous à votre projet
3. **Settings** → **API**
4. Copiez:
   - `URL`: → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public`: → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret`: → `SUPABASE_SERVICE_ROLE_KEY`

### Depuis GeniusPay:

1. Connectez-vous à votre compte GeniusPay
2. **Settings** ou **API Keys**
3. Copiez les clés API

## 3. Vérifier la Configuration

Après avoir ajouté les variables sur Vercel:

1. Créez un nouveau **Deployment** sur Vercel
2. Vérifiez les **Build Logs** - pas d'erreur "supabaseUrl is required"
3. La landing page devrait charger sans erreurs

## 4. Tests Locaux

```bash
# Copier le template
cp .env.example .env.local

# Remplir les valeurs réelles
nano .env.local

# Vérifier la compilation
npm run build

# Lancer localement
npm run dev
```

## Dépannage

### Erreur: "supabaseUrl is required" au build

→ Les variables d'environnement ne sont pas définies sur Vercel

**Solution**: Ajoutez-les dans Vercel Settings → Environment Variables

### Erreur: "webhook_events table not found"

→ Les tables Supabase n'existent pas dans votre nouvelle base

**Solution**: Exécutez les migrations SQL dans Supabase SQL Editor:

```sql
-- Créer les tables nécessaires
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  event_type TEXT,
  payload JSONB,
  signature_ok BOOLEAN,
  processed_at TIMESTAMP,
  error TEXT,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(provider, external_id)
);

CREATE TABLE checkout_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  tier TEXT,
  amount_minor INTEGER,
  currency TEXT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  amount_minor INTEGER,
  currency TEXT,
  status TEXT,
  provider TEXT,
  provider_ref TEXT,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  tier TEXT,
  status TEXT,
  amount_minor INTEGER,
  currency TEXT,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  provider TEXT,
  provider_ref TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

## Support

Si vous avez des questions, vérifiez:
- Les logs Vercel: `https://vercel.com/projects/profity`
- Les logs Supabase: Votre Dashboard Supabase
