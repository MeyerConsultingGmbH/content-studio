# 🚀 content.studio – Deployment Anleitung
## In ca. 15 Minuten live, komplett kostenlos

---

## Schritt 1 – Supabase Datenbank einrichten (5 Min)

1. Gehe zu **https://supabase.com** → "Start your project" → kostenloses Konto anlegen
2. "New project" → Name: `content-studio` → Passwort merken → Create
3. Warte bis das Projekt bereit ist (~1-2 Min)
4. Gehe zu **SQL Editor** (linke Sidebar) → "New query"
5. Öffne die Datei `supabase-schema.sql` aus diesem Ordner
6. Kopiere den kompletten Inhalt → füge ihn ein → klicke **"Run"**
7. Du siehst "Success" → fertig!

**API Keys holen:**
- Gehe zu **Settings** → **API**
- Kopiere: `Project URL` und `anon public` Key → diese brauchst du gleich

---

## Schritt 2 – Anthropic API Key holen (2 Min)

1. Gehe zu **https://console.anthropic.com**
2. "API Keys" → "Create Key"
3. Key kopieren und sicher aufbewahren

---

## Schritt 3 – GitHub Repository erstellen (3 Min)

1. Gehe zu **https://github.com** → "New repository"
2. Name: `content-studio` → Private → "Create repository"
3. Lade den `content-studio` Ordner hoch:
   - Klicke "uploading an existing file"
   - Ziehe alle Dateien aus dem `content-studio` Ordner rein
   - "Commit changes"

**Oder mit Git (wenn installiert):**
```bash
cd content-studio
git init
git add .
git commit -m "initial"
git remote add origin https://github.com/DEIN-NAME/content-studio.git
git push -u origin main
```

---

## Schritt 4 – Vercel deployen (3 Min)

1. Gehe zu **https://vercel.com** → kostenloses Konto mit GitHub verbinden
2. "Add New Project" → dein `content-studio` Repository auswählen
3. **Framework Preset:** Next.js (wird automatisch erkannt)
4. **Environment Variables** hinzufügen (sehr wichtig!):

   Klicke auf "Environment Variables" und füge diese ein:

   | Name | Wert |
   |------|------|
   | `ANTHROPIC_API_KEY` | sk-ant-... (dein Key) |
   | `NEXT_PUBLIC_SUPABASE_URL` | https://xxx.supabase.co |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dein anon key |
   | `ADMIN_PASSWORD` | dein-gewähltes-passwort |

5. Klicke **"Deploy"** → warte ~2 Min

---

## Schritt 5 – Fertig! 🎉

Deine App ist jetzt live unter z.B.:
```
https://content-studio-xyz.vercel.app
```

### Deine URLs:
- **Admin (du):** `https://deine-url.vercel.app` → mit deinem Passwort einloggen
- **Kunde Bella Italia:** `https://deine-url.vercel.app/kunde/bella-italia`
- **Kunde Gym Max:** `https://deine-url.vercel.app/kunde/gym-max`

---

## Was dein Kunde sieht und kann:

✅ Beiträge mit Bild (4:5) ansehen
✅ Instagram und Facebook Text wechseln
✅ Text direkt bearbeiten und speichern
✅ Status setzen: Freigeben oder Änderung anfordern
✅ Kommentare mit Änderungswünschen hinterlassen
✅ Status nachträglich noch ändern

Du siehst alle Änderungen deines Kunden sofort in deinem Admin-Dashboard.

---

## Eigene Domain (optional, kostenlos bei Vercel)

In Vercel → Settings → Domains → deine Domain eintragen.
Dann ist deine URL z.B. `https://content.deine-agentur.de`

---

## Updates einspielen

Änderungen in GitHub pushen → Vercel deployed automatisch. Fertig.

---

## Fragen?

Bei Problemen: Die Fehlermeldung aus Vercel kopieren und mich fragen!
