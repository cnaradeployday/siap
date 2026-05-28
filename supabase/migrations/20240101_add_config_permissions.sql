-- Tabla de configuración del sistema (logo, manual, etc.)
CREATE TABLE IF NOT EXISTS configuracion (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clave text UNIQUE NOT NULL,
  valor text,
  updated_at timestamptz DEFAULT now()
);

-- Tabla de proyectos habilitados por usuario
CREATE TABLE IF NOT EXISTS usuario_proyectos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id uuid REFERENCES usuarios(id) ON DELETE CASCADE,
  proyecto_id uuid REFERENCES proyectos(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(usuario_id, proyecto_id)
);

-- Bucket de almacenamiento para archivos del sistema
-- Ejecutar en Supabase Dashboard > Storage > New Bucket: "sistema" (public)
