-- Migration: Initial schema
-- Version: 20240101000000
-- Direction: down

-- Drop triggers first
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
DROP TRIGGER IF EXISTS update_automations_updated_at ON automations;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
DROP TRIGGER IF EXISTS update_bills_updated_at ON bills;
DROP TRIGGER IF EXISTS update_purchaseorders_updated_at ON purchaseorders;
DROP TRIGGER IF EXISTS update_salesorders_updated_at ON salesorders;
DROP TRIGGER IF EXISTS update_estimates_updated_at ON estimates;
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
DROP TRIGGER IF EXISTS update_taxes_updated_at ON taxes;
DROP TRIGGER IF EXISTS update_items_updated_at ON items;
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;

DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS login_attempts;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS automations;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS goals;
DROP TABLE IF EXISTS bills;
DROP TABLE IF EXISTS purchaseorders;
DROP TABLE IF EXISTS salesorders;
DROP TABLE IF EXISTS estimates;
DROP TABLE IF EXISTS invoice_line_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS taxes;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS contacts;

DROP EXTENSION IF EXISTS "pgcrypto";
DROP EXTENSION IF EXISTS "uuid-ossp";