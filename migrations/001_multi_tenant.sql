-- ============================================================
-- MIGRACIÓN MULTI-TENANT
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. TABLA ORGANIZACIONES
CREATE TABLE IF NOT EXISTS organizaciones (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre         text NOT NULL,
  texto_sidebar  text NOT NULL DEFAULT 'Sistema Administración Proyectos',
  color_primario text NOT NULL DEFAULT '#1B2A4A',
  color_acento   text NOT NULL DEFAULT '#2B6CB0',
  activo         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- 2. INSERTAR ORGANIZACIÓN INICIAL: MINISTERIO DE ECONOMÍA
INSERT INTO organizaciones (id, nombre, texto_sidebar, color_primario, color_acento)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Ministerio de Economía',
  'Sistema Administración Proyectos',
  '#1B2A4A',
  '#2B6CB0'
)
ON CONFLICT (id) DO NOTHING;

-- 3. AGREGAR is_super_admin A USUARIOS
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false;

-- 4. AGREGAR organizacion_id A USUARIOS
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS organizacion_id uuid REFERENCES organizaciones(id);

UPDATE usuarios
SET organizacion_id = '00000000-0000-0000-0000-000000000001'
WHERE organizacion_id IS NULL;

-- 5. AGREGAR organizacion_id A ROLES
ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS organizacion_id uuid REFERENCES organizaciones(id);

UPDATE roles
SET organizacion_id = '00000000-0000-0000-0000-000000000001'
WHERE organizacion_id IS NULL;

-- 6. AGREGAR organizacion_id A PROYECTOS
ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS organizacion_id uuid REFERENCES organizaciones(id);

UPDATE proyectos
SET organizacion_id = '00000000-0000-0000-0000-000000000001'
WHERE organizacion_id IS NULL;

-- 7. AGREGAR organizacion_id A LINEAS_ACCION
ALTER TABLE lineas_accion
  ADD COLUMN IF NOT EXISTS organizacion_id uuid REFERENCES organizaciones(id);

UPDATE lineas_accion
SET organizacion_id = '00000000-0000-0000-0000-000000000001'
WHERE organizacion_id IS NULL;

-- 8. AGREGAR organizacion_id A TAREAS
ALTER TABLE tareas
  ADD COLUMN IF NOT EXISTS organizacion_id uuid REFERENCES organizaciones(id);

UPDATE tareas
SET organizacion_id = '00000000-0000-0000-0000-000000000001'
WHERE organizacion_id IS NULL;

-- 9. AGREGAR organizacion_id A LOGS_AUDITORIA
ALTER TABLE logs_auditoria
  ADD COLUMN IF NOT EXISTS organizacion_id uuid REFERENCES organizaciones(id);

UPDATE logs_auditoria
SET organizacion_id = '00000000-0000-0000-0000-000000000001'
WHERE organizacion_id IS NULL;

-- 10. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_usuarios_organizacion ON usuarios(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_roles_organizacion ON roles(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_organizacion ON proyectos(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_lineas_organizacion ON lineas_accion(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_tareas_organizacion ON tareas(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_logs_organizacion ON logs_auditoria(organizacion_id);

-- ============================================================
-- LISTO. Verificar con:
-- SELECT nombre, color_primario, color_acento FROM organizaciones;
-- SELECT COUNT(*) FROM usuarios WHERE organizacion_id IS NOT NULL;
-- SELECT COUNT(*) FROM proyectos WHERE organizacion_id IS NOT NULL;
-- ============================================================
