-- Tabla de acceso de usuarios a proyectos (visibilidad)
-- Esta tabla NO modifica el patrocinador_id de los proyectos.
-- Permite asignar qué proyectos puede ver cada usuario.

CREATE TABLE IF NOT EXISTS usuario_proyectos (
  usuario_id  UUID NOT NULL REFERENCES usuarios(id)  ON DELETE CASCADE,
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, proyecto_id)
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_usuario_proyectos_usuario  ON usuario_proyectos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_proyectos_proyecto ON usuario_proyectos(proyecto_id);
