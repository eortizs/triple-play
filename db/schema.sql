-- Esquema PostgreSQL para triple-play (modo production)
-- Base de datos: skeletor · JSONB para atributos de producto e items de venta.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS usuarios (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nombre        TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('desarrollador', 'propietario', 'usuario')),
  level         INTEGER NOT NULL DEFAULT 1,
  activo        BOOLEAN NOT NULL DEFAULT true,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS productos (
  id        TEXT PRIMARY KEY,
  sku       TEXT NOT NULL UNIQUE,
  nombre    TEXT NOT NULL,
  categoria TEXT NOT NULL,
  precio    NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
  stock     INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock INTEGER NOT NULL DEFAULT 0,
  atributos JSONB NOT NULL DEFAULT '{}'::jsonb,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos (categoria);
CREATE INDEX IF NOT EXISTS idx_productos_atributos ON productos USING GIN (atributos);

CREATE TABLE IF NOT EXISTS ventas (
  id              TEXT PRIMARY KEY,
  folio           TEXT NOT NULL UNIQUE,
  estado          TEXT NOT NULL CHECK (estado IN ('completada', 'pendiente', 'cancelada')),
  metodo_pago     TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'transferencia')),
  total           NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  vendedor_id     TEXT NOT NULL REFERENCES usuarios (id),
  vendedor_nombre TEXT NOT NULL,
  items           JSONB NOT NULL DEFAULT '[]'::jsonb,
  fecha           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_items ON ventas USING GIN (items);

-- Semilla mínima (contraseñas: sha256 del texto plano)
INSERT INTO usuarios (id, username, password_hash, nombre, role, level, activo)
VALUES
  ('u-dev', 'dev', encode(digest('dev123', 'sha256'), 'hex'), 'Equipo Desarrollo', 'desarrollador', 0, true),
  ('u-propietario', 'propietario', encode(digest('propietario123', 'sha256'), 'hex'), 'Doña Reyna Martínez', 'propietario', 4, true),
  ('u-ana', 'ana', encode(digest('ana123', 'sha256'), 'hex'), 'Ana López', 'usuario', 1, true),
  ('u-luis', 'luis', encode(digest('luis123', 'sha256'), 'hex'), 'Luis Hernández', 'usuario', 2, true),
  ('u-carla', 'carla', encode(digest('carla123', 'sha256'), 'hex'), 'Carla Ramírez', 'usuario', 3, true)
ON CONFLICT (id) DO NOTHING;
