-- ==========================================
-- PIXELART DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. KULLANICI & YETKİLENDİRME (Users & Auth)
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'designer', 'accountant', 'client');

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'designer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. MÜŞTERİ / CARİ YÖNETİMİ (Clients / Customers)
CREATE TYPE client_type AS ENUM ('individual', 'company');
CREATE TYPE client_status AS ENUM ('active', 'archived');

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type client_type NOT NULL DEFAULT 'individual',
    name TEXT NOT NULL,
    company_title TEXT,
    tax_office TEXT,
    tax_number TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    status client_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PROJE VE HİZMET YÖNETİMİ (Projects)
CREATE TYPE project_status AS ENUM ('lead', 'in_progress', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status project_status NOT NULL DEFAULT 'in_progress',
    budget NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. HESAP YÖNETİMİ (Kasa / Banka / Kredi Kartı / POS)
CREATE TYPE account_type AS ENUM ('bank', 'cash', 'credit_card', 'pos');

CREATE TABLE IF NOT EXISTS finance_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type account_type NOT NULL DEFAULT 'bank',
    currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. GELİR / GİDER KATEGORİLERİ (Categories)
CREATE TYPE category_type AS ENUM ('income', 'expense');

CREATE TABLE IF NOT EXISTS finance_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES finance_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type category_type NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. FATURA VE BELGE YÖNETİMİ (Invoices)
CREATE TYPE invoice_type AS ENUM ('sales', 'purchase');
CREATE TYPE invoice_status AS ENUM ('draft', 'pending', 'paid', 'partially_paid', 'overdue', 'cancelled');

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    type invoice_type NOT NULL DEFAULT 'sales',
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
    status invoice_status NOT NULL DEFAULT 'pending',
    document_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. FİNANSAL İŞLEMLER (Finance Transactions)
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'bank_transfer', 'other');

CREATE TABLE IF NOT EXISTS finance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type transaction_type NOT NULL,
    account_id UUID REFERENCES finance_accounts(id) ON DELETE RESTRICT NOT NULL,
    to_account_id UUID REFERENCES finance_accounts(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES finance_categories(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
    exchange_rate NUMERIC(10, 4) NOT NULL DEFAULT 1.0000,
    net_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    payment_method payment_method NOT NULL DEFAULT 'bank_transfer',
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TEKRARLAYAN İŞLEMLER (Recurring Transactions)
CREATE TYPE recurrence_frequency AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly');
CREATE TYPE recurrence_status AS ENUM ('active', 'paused', 'completed');

CREATE TABLE IF NOT EXISTS recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type transaction_type NOT NULL,
    account_id UUID REFERENCES finance_accounts(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES finance_categories(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
    frequency recurrence_frequency NOT NULL DEFAULT 'monthly',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    last_processed_date DATE,
    next_due_date DATE NOT NULL,
    auto_process BOOLEAN NOT NULL DEFAULT true,
    status recurrence_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SAMPLE INITIAL DATA
INSERT INTO finance_accounts (name, type, currency, balance) VALUES
('Ana Kasa', 'cash', 'TRY', 15000.00),
('Ziraat Bankası Ticari', 'bank', 'TRY', 85000.00),
('Garanti USD Hesabı', 'bank', 'USD', 4200.00)
ON CONFLICT DO NOTHING;

INSERT INTO finance_categories (name, type, description) VALUES
('Tasarım & Proje Gelirleri', 'income', 'PixelArt özel tasarım ve projelendirme gelirleri'),
('Yazılım Lisansları & Tooling', 'expense', 'SaaS ve grafik tasarım araç abonelikleri'),
('Operasyonel & Ofis', 'expense', 'Ofis kirası, fatura ve genel yönetim ödemeleri'),
('Personel Ödemeleri', 'expense', 'Maaş, prim ve yan haklar')
ON CONFLICT DO NOTHING;
