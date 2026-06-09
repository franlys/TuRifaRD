-- ==========================================
-- SCHEMA DE BASE DE DATOS PARA RIFA2RD (SUPABASE)
-- Copia y pega este script en el editor SQL de tu panel de Supabase
-- ==========================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Tenants (Inquilinos/Marcas)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(50) DEFAULT '#FFD700',
    secondary_color VARCHAR(50) DEFAULT '#FFE57F',
    bg_color VARCHAR(50) DEFAULT '#0A0A0F',
    card_bg VARCHAR(50) DEFAULT '#12121A',
    border_bg VARCHAR(50) DEFAULT '#1E1E2E',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en Tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura publica de tenants" ON tenants FOR SELECT USING (true);

-- 2. Tabla de Creadores
CREATE TABLE IF NOT EXISTS creators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending_verification')),
    created_raffles_count INTEGER DEFAULT 0,
    activation_receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en Creadores
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura publica de creadores" ON creators FOR SELECT USING (true);

-- 3. Tabla de Sorteos (Raffles)
CREATE TABLE IF NOT EXISTS raffles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES creators(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    draw_date TIMESTAMP WITH TIME ZONE NOT NULL,
    ticket_price NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'RD$',
    total_tickets INTEGER DEFAULT 1000,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'drawing', 'finished')),
    prize_image TEXT,
    winner_ticket_id UUID,
    winner_name VARCHAR(255),
    finished_at TIMESTAMP WITH TIME ZONE,
    payment_bank_name VARCHAR(255) NOT NULL,
    payment_account_holder VARCHAR(255) NOT NULL,
    payment_bank_id VARCHAR(255) NOT NULL,
    payment_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en Sorteos
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura publica de sorteos" ON raffles FOR SELECT USING (true);

-- 4. Tabla de Premios (Prizes)
CREATE TABLE IF NOT EXISTS prizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raffle_id UUID REFERENCES raffles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position INTEGER DEFAULT 1
);

ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura publica de premios" ON prizes FOR SELECT USING (true);

-- 5. Tabla de Boletos/Tickets
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    raffle_id UUID REFERENCES raffles(id) ON DELETE CASCADE,
    ticket_number VARCHAR(10) NOT NULL,
    buyer_name VARCHAR(255) NOT NULL,
    buyer_email VARCHAR(255) NOT NULL,
    buyer_phone VARCHAR(255) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending_verification' CHECK (payment_status IN ('pending_verification', 'verified')),
    receipt_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en Tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura publica de tickets" ON tickets FOR SELECT USING (true);
CREATE POLICY "Permitir insercion publica de tickets" ON tickets FOR INSERT WITH CHECK (true);

-- ==========================================
-- REGISTROS DE PRUEBA (MOCKS DE INICIO)
-- ==========================================

-- Insertar Tenants
INSERT INTO tenants (id, slug, company_name, primary_color, secondary_color, bg_color, card_bg, border_bg) VALUES
('00000000-0000-0000-0000-000000000000', 'turifard', 'Tu Rifa RD', '#FFD700', '#FFE57F', '#0A0A0F', '#12121A', '#1E1E2E'),
('11111111-1111-1111-1111-111111111111', 'banshee', 'Banshees RD', '#FF9F0A', '#FFD60A', '#0B0A0F', '#14121A', '#221E2F'),
('22222222-2222-2222-2222-222222222222', 'cibao', 'Sorteos del Cibao', '#00F5FF', '#80FBFF', '#080F1A', '#0F1A2B', '#1E2F47')
ON CONFLICT (slug) DO NOTHING;

-- Insertar Creadores
INSERT INTO creators (id, tenant_id, name, email, status) VALUES
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Randy Fernández', 'randy.f@rifas.com', 'active'),
('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Juan Pérez', 'juan.p@rifas.com', 'active')
ON CONFLICT (email) DO NOTHING;

-- Insertar Sorteos
INSERT INTO raffles (id, tenant_id, creator_id, title, description, draw_date, ticket_price, currency, total_tickets, status, prize_image, payment_bank_name, payment_account_holder, payment_bank_id, payment_details) VALUES
('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '1er Sorteo de Banshee Exótico', 'Participa y gana un Banshee Exótico listo para rodar.', now() + interval '2 days', 200.00, 'RD$', 1000, 'active', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800', 'Banco BHD & Banreservas', 'Randy Fernández', '402-3839670-5', 'Poner nombre completo en concepto.'),
('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', '1er Sorteo de Jeepeta Cibao', '¡Llévate a casa esta increíble Jeepeta 4x4 todo terreno!', now() + interval '4 days', 500.00, 'RD$', 500, 'active', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800', 'Banco Popular Dominicano', 'Juan Pérez', '792-348293-1', 'Colocar cédula en concepto.')
ON CONFLICT DO NOTHING;
