-- ═══════════════════════════════════════════════════════════
--  APEX DIGITAL GROWTH — Supabase Schema
--  Ejecutar en Supabase → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

-- 1. PROSPECTOS
-- Todos los negocios extraídos de Apify/Google Maps
CREATE TABLE prospectos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug            TEXT UNIQUE,          -- ej: restaurante-el-rincon-bogota
  nombre          TEXT NOT NULL,
  sector          TEXT,
  ciudad          TEXT,
  pais            TEXT DEFAULT 'CO',
  direccion       TEXT,
  telefono        TEXT,
  whatsapp        TEXT,
  email           TEXT,
  sitio_web       TEXT,
  tiene_email     BOOLEAN DEFAULT false,
  tiene_whatsapp  BOOLEAN DEFAULT false,
  tiene_sitio_web BOOLEAN DEFAULT false,
  estado_web      TEXT,                 -- sin_sitio | desactualizado | tiene_sitio
  rating          DECIMAL(3,1),
  num_reseñas     INTEGER DEFAULT 0,
  canal_contacto  TEXT,                 -- email | whatsapp | telefono
  prioridad       TEXT,                 -- alta | media | baja
  score           INTEGER DEFAULT 0,
  facebook        TEXT,
  instagram       TEXT,
  -- Contenido generado por Claude
  contenido_web   JSONB,                -- {hero_titulo, hero_subtitulo, servicios[], ...}
  colores         JSONB DEFAULT '{"primario":"#0f172a","acento":"#f0c060"}',
  -- Estado del pipeline
  estado          TEXT DEFAULT 'nuevo', -- nuevo|email_enviado|propuesta_vista|pagado|activo|inactivo
  plan_comprado   TEXT,                 -- basico|estandar|premium
  fecha_pago      TIMESTAMPTZ,
  stripe_customer_id TEXT,
  url_definitiva  TEXT,
  -- N8N tracking
  apify_run_id    TEXT,
  n8n_run_id      TEXT,
  email_enviado_at TIMESTAMPTZ,
  propuesta_vista_at TIMESTAMPTZ,
  -- Meta
  fecha_extraccion TIMESTAMPTZ DEFAULT NOW(),
  fecha_actualizado TIMESTAMPTZ DEFAULT NOW()
);

-- Index para búsquedas frecuentes
CREATE INDEX idx_prospectos_estado ON prospectos(estado);
CREATE INDEX idx_prospectos_prioridad ON prospectos(prioridad);
CREATE INDEX idx_prospectos_canal ON prospectos(canal_contacto);
CREATE INDEX idx_prospectos_slug ON prospectos(slug);

-- 2. PAGOS
CREATE TABLE pagos (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prospecto_id        UUID REFERENCES prospectos(id),
  stripe_session_id   TEXT UNIQUE,
  stripe_payment_id   TEXT,
  plan                TEXT,
  monto_usd           DECIMAL(10,2),
  estado              TEXT DEFAULT 'pendiente', -- pendiente|confirmado|reembolsado
  fecha               TIMESTAMPTZ DEFAULT NOW(),
  fecha_pago          TIMESTAMPTZ,
  metadata            JSONB
);

-- 3. VISITAS a páginas de propuesta
CREATE TABLE visitas (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prospecto_id UUID REFERENCES prospectos(id),
  fecha        TIMESTAMPTZ DEFAULT NOW(),
  ip           TEXT,
  user_agent   TEXT,
  tiempo_en_pagina INTEGER  -- segundos
);

-- 4. EMAILS enviados
CREATE TABLE emails (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prospecto_id    UUID REFERENCES prospectos(id),
  resend_id       TEXT,
  asunto          TEXT,
  plantilla       TEXT,   -- nuevo_sitio|rediseno|followup_1|followup_2
  estado          TEXT DEFAULT 'enviado', -- enviado|abierto|click|rebotado|spam
  enviado_at      TIMESTAMPTZ DEFAULT NOW(),
  abierto_at      TIMESTAMPTZ,
  click_at        TIMESTAMPTZ
);

-- 5. ACTUALIZACIONES solicitadas por clientes (vía Telegram)
CREATE TABLE actualizaciones (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prospecto_id    UUID REFERENCES prospectos(id),
  descripcion     TEXT,
  campo           TEXT,    -- texto que cambiar
  valor_nuevo     TEXT,    -- nuevo valor
  estado          TEXT DEFAULT 'pendiente', -- pendiente|aplicado
  solicitado_at   TIMESTAMPTZ DEFAULT NOW(),
  aplicado_at     TIMESTAMPTZ,
  telegram_chat_id TEXT
);

-- 6. CLIENTES ACTIVOS (post-venta)
CREATE TABLE clientes (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prospecto_id            UUID REFERENCES prospectos(id) UNIQUE,
  telegram_chat_id        TEXT,
  codigo_activacion       TEXT UNIQUE,    -- APEX-XXXX
  url_sitio               TEXT,
  plan                    TEXT,
  actualizaciones_incluidas INTEGER DEFAULT 1,
  actualizaciones_usadas  INTEGER DEFAULT 0,
  mes_actual              TEXT,           -- 2024-01
  fecha_inicio            TIMESTAMPTZ DEFAULT NOW(),
  fecha_renovacion        TIMESTAMPTZ,
  activo                  BOOLEAN DEFAULT true
);

-- 7. RUNS DE APIFY (tracking del scraper)
CREATE TABLE apify_runs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id      TEXT UNIQUE,
  sector      TEXT,
  ciudad      TEXT,
  pais        TEXT,
  cantidad_objetivo INTEGER,
  extraidos   INTEGER DEFAULT 0,
  con_email   INTEGER DEFAULT 0,
  estado      TEXT DEFAULT 'running', -- running|completado|error
  iniciado_at TIMESTAMPTZ DEFAULT NOW(),
  completado_at TIMESTAMPTZ
);

-- ═══ FUNCIONES ÚTILES ═══════════════════════════════════════

-- Función para actualizar fecha_actualizado automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizado = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prospectos_updated_at
  BEFORE UPDATE ON prospectos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Vista para el dashboard
CREATE VIEW dashboard_stats AS
SELECT
  COUNT(*) as total_prospectos,
  COUNT(*) FILTER (WHERE tiene_email) as con_email,
  COUNT(*) FILTER (WHERE tiene_whatsapp AND NOT tiene_email) as con_whatsapp,
  COUNT(*) FILTER (WHERE estado_web = 'sin_sitio') as sin_sitio,
  COUNT(*) FILTER (WHERE estado = 'email_enviado') as emails_enviados,
  COUNT(*) FILTER (WHERE estado = 'propuesta_vista') as propuestas_vistas,
  COUNT(*) FILTER (WHERE estado = 'pagado') as pagados,
  COUNT(*) FILTER (WHERE estado = 'activo') as clientes_activos,
  COALESCE(SUM(p2.monto_usd) FILTER (WHERE p2.estado = 'confirmado'), 0) as revenue_total
FROM prospectos
LEFT JOIN pagos p2 ON p2.prospecto_id = prospectos.id;

-- ═══ ROW LEVEL SECURITY ════════════════════════════════════

ALTER TABLE prospectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Solo el service role puede leer/escribir todo
CREATE POLICY "service_role_all" ON prospectos
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON pagos
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON clientes
  FOR ALL USING (auth.role() = 'service_role');

-- La app de propuestas puede leer prospectos por slug (anónimo)
CREATE POLICY "propuesta_read" ON prospectos
  FOR SELECT USING (true);
