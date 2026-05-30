-- ================================================================
-- CONTENT STUDIO – Supabase Schema
-- Füge diesen Code in Supabase → SQL Editor → New Query ein
-- und klicke auf "Run"
-- ================================================================

-- Kunden-Tabelle
create table if not exists customers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  instagram text,
  facebook text,
  industry text,
  tone text,
  description text,
  refs text[] default '{}',
  lang text default 'de',
  slug text unique not null,  -- URL-freundlicher Name z.B. "bella-italia"
  created_at timestamptz default now()
);

-- Beiträge-Tabelle
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references customers(id) on delete cascade,
  customer_name text not null,
  image_url text,           -- Bild-URL (base64 oder Storage-URL)
  ig_text text,             -- Original Instagram-Text
  fb_text text,             -- Original Facebook-Text
  ig_edit text,             -- Bearbeiteter Instagram-Text
  fb_edit text,             -- Bearbeiteter Facebook-Text
  hashtags text[] default '{}',
  status text default 'pending',
  -- Status-Werte:
  -- pending   = Entwurf (nur du siehst es)
  -- review    = Du prüfst intern
  -- kunde     = Beim Kunden zur Abnahme
  -- approved  = Vom Kunden freigegeben
  -- rejected  = Vom Kunden abgelehnt / Änderung nötig
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Kommentare-Tabelle
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade,
  author text not null,     -- "admin" oder Kundenname
  text text not null,
  created_at timestamptz default now()
);

-- Auto-Update für updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger posts_updated_at
  before update on posts
  for each row execute function update_updated_at();

-- Row Level Security (alle lesen erlaubt, schreiben auch – du sicherst per Admin-PW in der App)
alter table customers enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;

create policy "Public read customers" on customers for select using (true);
create policy "Public write customers" on customers for all using (true);
create policy "Public read posts" on posts for select using (true);
create policy "Public write posts" on posts for all using (true);
create policy "Public read comments" on comments for select using (true);
create policy "Public write comments" on comments for all using (true);

-- ================================================================
-- FERTIG! Jetzt kannst du die App starten.
-- ================================================================
