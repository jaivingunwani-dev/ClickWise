-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Main Policy Cache Table
CREATE TABLE IF NOT EXISTS policy_cache (
  content_hash TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  doc_type TEXT NOT NULL,                 -- tos | privacy | cookie | eula | api_terms
  digital_platform_category TEXT,        -- saas | ecommerce | social | ai_tool | software
  summary JSONB NOT NULL,
  risk_score JSONB NOT NULL,
  ai_training_clause BOOLEAN DEFAULT false,
  dark_patterns_detected JSONB DEFAULT '[]'::jsonb,
  raw_text_ref TEXT,                      -- Pointer to cloud storage reference
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for domain lookups
CREATE INDEX IF NOT EXISTS idx_policy_cache_domain ON policy_cache(domain);
CREATE INDEX IF NOT EXISTS idx_policy_cache_doc_type ON policy_cache(doc_type);

-- 2. Policy Diffs Table (Change History)
CREATE TABLE IF NOT EXISTS policy_diffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  old_hash TEXT REFERENCES policy_cache(content_hash),
  new_hash TEXT REFERENCES policy_cache(content_hash),
  diff_summary JSONB NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for diff lookups
CREATE INDEX IF NOT EXISTS idx_policy_diffs_domain ON policy_diffs(domain);
CREATE INDEX IF NOT EXISTS idx_policy_diffs_new_hash ON policy_diffs(new_hash);

-- 3. Versioned Red-Flag Rules Table
CREATE TABLE IF NOT EXISTS red_flag_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code TEXT UNIQUE NOT NULL,        -- e.g., 'FLAG_AI_TRAINING'
  category TEXT NOT NULL,                 -- e.g., 'IP_RIGHTS', 'SUBSCRIPTION_TRAP'
  weight INTEGER NOT NULL,                -- Penalty points
  pattern_keywords TEXT[],                -- Regex / keyword triggers
  description TEXT NOT NULL,
  version INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for rule lookups
CREATE INDEX IF NOT EXISTS idx_red_flag_rules_category ON red_flag_rules(category);

-- 4. User Quotas Table
CREATE TABLE IF NOT EXISTS user_quota (
  user_id UUID PRIMARY KEY,
  tier TEXT DEFAULT 'free',                -- free | pro
  scans_this_month INT DEFAULT 0,
  max_scans_per_month INT DEFAULT 10,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default red-flag rules
INSERT INTO red_flag_rules (rule_code, category, weight, pattern_keywords, description, version) VALUES
('FLAG_AI_TRAINING', 'IP_RIGHTS', 20, ARRAY['train', 'ai model', 'machine learning', 'royalty-free', 'license'], 'Royalty-free rights to user content for AI model training', 1),
('FLAG_AUTO_RENEWAL', 'SUBSCRIPTION_TRAP', 15, ARRAY['auto-renew', 'automatically renew', 'auto renewal'], 'Auto-renewal without explicit email notice', 1),
('FLAG_DATA_SELLING', 'DATA_PRIVACY', 25, ARRAY['sell', 'data broker', 'third party', 'share', 'monetize'], 'Selling/sharing personal data with 3rd-party brokers', 1),
('FLAG_BINDING_ARBITRATION', 'LEGAL', 15, ARRAY['arbitration', 'binding arbitration', 'class action waiver'], 'Mandatory binding arbitration & class action waiver', 1),
('FLAG_ACCOUNT_TERMINATION', 'ACCOUNT_OWNERSHIP', 15, ARRAY['terminate account', 'immediately', 'no grace period'], 'Immediate account termination without data export grace period', 1),
('FLAG_TRACKING', 'TRACKING', 10, ARRAY['cross-site tracking', 'canvas fingerprinting', 'tracking'], 'Cross-site tracking / Canvas fingerprinting', 1)
ON CONFLICT (rule_code) DO NOTHING;
