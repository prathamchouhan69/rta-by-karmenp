-- Migration: Feature flags
-- Version: 20240102000000
-- Direction: down

DROP TRIGGER IF EXISTS update_feature_flags_updated_at ON feature_flags;
DROP TABLE IF EXISTS feature_flags;
DROP TABLE IF EXISTS users;