# Tickets Dashboard — Návod na nasazení

## Co budeš potřebovat
- Účet na [GitHub](https://github.com) (zdarma)
- Účet na [Supabase](https://supabase.com) (zdarma)
- Účet na [Vercel](https://vercel.com) (zdarma)

---

## KROK 1 — Supabase (databáze + login)

1. Jdi na https://supabase.com a zaregistruj se
2. Klikni **New Project** → vyber název (např. `tickets-dashboard`) → nastav heslo → Create
3. Počkej než se projekt vytvoří (~1 min)

### Vytvoř tabulky v databázi

V Supabase vlevo klikni na **SQL Editor** a spusť tento SQL:

```sql
-- Tabulka měsíců
CREATE TABLE months (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  expenses NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabulka brokerů/účtů
CREATE TABLE brokers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month_id UUID REFERENCES months(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  payout NUMERIC DEFAULT 0
);

-- Bezpečnost — každý vidí jen svá data
ALTER TABLE months ENABLE ROW LEVEL SECURITY;
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own months" ON months
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own brokers" ON brokers
  FOR ALL USING (auth.uid() = user_id);
```

### Vytvoř svůj účet (login)

1. V Supabase vlevo klikni **Authentication** → **Users**
2. Klikni **Add user** → zadej svůj email a heslo → Create

### Získej API klíče

1. Vlevo klikni **Settings** → **API**
2. Zkopíruj:
   - **Project URL** (vypadá jako `https://xxxxx.supabase.co`)
   - **anon public** key (dlouhý string)

---

## KROK 2 — GitHub (nahrání kódu)

1. Jdi na https://github.com/new
2. Vytvoř nový repozitář (např. `tickets-dashboard`), nastav jako **Private**
3. Nahrij do něj všechny soubory z tohoto projektu

Nejjednodušší způsob — nainstaluj [GitHub Desktop](https://desktop.github.com):
- Otevři GitHub Desktop → File → Add Local Repository → vyber složku s projektem
- Publish repository

---

## KROK 3 — Vercel (deploy)

1. Jdi na https://vercel.com a přihlaš se přes GitHub
2. Klikni **New Project** → vyber tvůj GitHub repozitář
3. Klikni **Environment Variables** a přidej:
   - `NEXT_PUBLIC_SUPABASE_URL` = tvoje Project URL ze Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tvůj anon key ze Supabase
4. Klikni **Deploy**

Po ~2 minutách dostaneš URL (např. `tickets-dashboard.vercel.app`) — to je tvoje appka! 🎉

---

## Přihlášení

Jdi na tvoji URL, zadej email a heslo které jsi nastavil v Supabase Auth → jsi dovnitř.

Nikdo jiný se nedostane bez hesla.

---

## Problémy?

Napiš mi a vyřeším to s tebou.
