-- ============================================================
-- MIGRACIÓN: SLUG DE ORGANIZACIÓN (para subdominio)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS unaccent;

ALTER TABLE organizaciones
  ADD COLUMN IF NOT EXISTS slug text;

-- Backfill: generar slug a partir del nombre para organizaciones existentes
UPDATE organizaciones
SET slug = regexp_replace(
  regexp_replace(lower(unaccent(nombre)), '[^a-z0-9]+', '-', 'g'),
  '(^-+|-+$)', '', 'g'
)
WHERE slug IS NULL;

ALTER TABLE organizaciones
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizaciones_slug ON organizaciones(slug);

-- ============================================================
-- LISTO. Verificar con:
-- SELECT nombre, slug FROM organizaciones;
-- ============================================================
