-- Migration: Initial schema
-- Version: 20240101000000
-- Direction: up

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Core entities
CREATE TABLE contacts (
    contact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zoho_id VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(100),
    billing_address JSONB,
    shipping_address JSONB,
    gst_treatment VARCHAR(50),
    gstin VARCHAR(50),
    place_of_contact VARCHAR(100),
    currency_code VARCHAR(10) DEFAULT 'INR',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contacts_zoho_id ON contacts(zoho_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_name ON contacts(name);

CREATE TABLE items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zoho_id VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rate NUMERIC(15,2) DEFAULT 0,
    unit VARCHAR(50),
    sku VARCHAR(100),
    tax_id UUID REFERENCES taxes(tax_id),
    tax_name VARCHAR(100),
    tax_percentage NUMERIC(5,2),
    hsn_code VARCHAR(20),
    sac_code VARCHAR(20),
    product_type VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_items_zoho_id ON items(zoho_id);
CREATE INDEX idx_items_name ON items(name);
CREATE INDEX idx_items_hsn_code ON items(hsn_code);

CREATE TABLE taxes (
    tax_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zoho_id VARCHAR(255) UNIQUE,
    name VARCHAR(100) NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    tax_type VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_taxes_zoho_id ON taxes(zoho_id);

-- Transactions
CREATE TABLE invoices (
    invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zoho_id VARCHAR(255) UNIQUE,
    invoice_number VARCHAR(100) UNIQUE,
    customer_id UUID REFERENCES contacts(contact_id),
    customer_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    date DATE NOT NULL,
    due_date DATE,
    currency_code VARCHAR(10) DEFAULT 'INR',
    exchange_rate NUMERIC(10,6) DEFAULT 1,
    subtotal NUMERIC(15,2) DEFAULT 0,
    total NUMERIC(15,2) DEFAULT 0,
    tax_total NUMERIC(15,2) DEFAULT 0,
    balance NUMERIC(15,2) DEFAULT 0,
    payment_expected_date DATE,
    last_payment_date DATE,
    reference_number VARCHAR(100),
    notes TEXT,
    terms TEXT,
    salesperson_id UUID,
    is_emailed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_zoho_id ON invoices(zoho_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_balance ON invoices(balance) WHERE balance > 0;

CREATE TABLE invoice_line_items (
    line_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(item_id),
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity NUMERIC(15,3) DEFAULT 1,
    rate NUMERIC(15,2) DEFAULT 0,
    discount NUMERIC(15,2) DEFAULT 0,
    tax_id UUID REFERENCES taxes(tax_id),
    tax_name VARCHAR(100),
    tax_percentage NUMERIC(5,2),
    line_total NUMERIC(15,2) GENERATED ALWAYS AS ((quantity * rate) - discount) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);

-- Other transaction tables (similar pattern)
CREATE TABLE estimates (
    estimate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zoho_id VARCHAR(255) UNIQUE,
    estimate_number VARCHAR(100) UNIQUE,
    customer_id UUID REFERENCES contacts(contact_id),
    status VARCHAR(50) DEFAULT 'draft',
    date DATE,
    expiry_date DATE,
    total NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE salesorders (
    salesorder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zoho_id VARCHAR(255) UNIQUE,
    salesorder_number VARCHAR(100) UNIQUE,
    customer_id UUID REFERENCES contacts(contact_id),
    status VARCHAR(50) DEFAULT 'draft',
    date DATE,
    total NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE purchaseorders (
    purchaseorder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zoho_id VARCHAR(255) UNIQUE,
    purchaseorder_number VARCHAR(100) UNIQUE,
    vendor_id UUID REFERENCES contacts(contact_id),
    status VARCHAR(50) DEFAULT 'draft',
    date DATE,
    total NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bills (
    bill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zoho_id VARCHAR(255) UNIQUE,
    bill_number VARCHAR(100) UNIQUE,
    vendor_id UUID REFERENCES contacts(contact_id),
    status VARCHAR(50) DEFAULT 'open',
    date DATE,
    due_date DATE,
    total NUMERIC(15,2) DEFAULT 0,
    balance NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Flux-specific tables
CREATE TABLE goals (
    goal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metric VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    baseline_value NUMERIC(15,4) NOT NULL,
    baseline_date DATE NOT NULL,
    target_value NUMERIC(15,4) NOT NULL,
    target_date DATE NOT NULL,
    current_value NUMERIC(15,4),
    current_date DATE,
    owner VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'on_track',
    target_band_min NUMERIC(15,4),
    target_band_max NUMERIC(15,4),
    weekly_capacity NUMERIC(15,4),
    progress_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_owner ON goals(owner);
CREATE INDEX idx_goals_status ON goals(status);

CREATE TABLE tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'open',
    owner VARCHAR(100) NOT NULL,
    due_date DATE,
    source_type VARCHAR(50) DEFAULT 'manual',
    source_id VARCHAR(255),
    goal_id UUID REFERENCES goals(goal_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_owner ON tasks(owner);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_goal ON tasks(goal_id);

CREATE TABLE automations (
    automation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) NOT NULL,
    trigger_config JSONB NOT NULL,
    action VARCHAR(50) NOT NULL DEFAULT 'create_internal_task',
    action_config JSONB,
    schedule_time TIME,
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    enabled BOOLEAN DEFAULT true,
    next_run_at TIMESTAMPTZ,
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_automations_enabled ON automations(enabled);
CREATE INDEX idx_automations_next_run ON automations(next_run_at);

CREATE TABLE documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    linked_record_id VARCHAR(255),
    external_action BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'draft',
    version INTEGER DEFAULT 1,
    previous_version_id UUID REFERENCES documents(document_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_linked ON documents(linked_record_id);

-- Audit log
CREATE TABLE audit_log (
    audit_id BIGSERIAL PRIMARY KEY,
    actor VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id VARCHAR(255),
    result VARCHAR(50),
    idempotency_key VARCHAR(255),
    metadata JSONB,
    previous_hash VARCHAR(64),
    hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_resource ON audit_log(resource, resource_id);
CREATE INDEX idx_audit_actor ON audit_log(actor);
CREATE INDEX idx_audit_created ON audit_log(created_at);
CREATE INDEX idx_audit_idempotency ON audit_log(idempotency_key);

-- Login attempts
CREATE TABLE login_attempts (
    attempt_id BIGSERIAL PRIMARY KEY,
    client_hash VARCHAR(64) NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    success BOOLEAN DEFAULT false
);

CREATE INDEX idx_login_attempts_client ON login_attempts(client_hash);
CREATE INDEX idx_login_attempts_time ON login_attempts(attempted_at);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_taxes_updated_at BEFORE UPDATE ON taxes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_estimates_updated_at BEFORE UPDATE ON estimates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_salesorders_updated_at BEFORE UPDATE ON salesorders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchaseorders_updated_at BEFORE UPDATE ON purchaseorders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automations_updated_at BEFORE UPDATE ON automations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();