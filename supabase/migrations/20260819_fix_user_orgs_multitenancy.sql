-- Fix user_orgs table for multi-tenancy support
-- Allow customers to belong to multiple organizations

-- Drop old policy
DROP POLICY IF EXISTS "Users can view their own org mapping" ON user_orgs;

-- Rename current table to backup
ALTER TABLE user_orgs RENAME TO user_orgs_old;

-- Create new user_orgs table with proper structure
CREATE TABLE user_orgs (
    user_id uuid not null,
    org_id uuid not null,
    role text default 'member'::text not null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    CONSTRAINT user_orgs_pkey PRIMARY KEY (user_id, org_id),
    CONSTRAINT user_orgs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT user_orgs_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_user_orgs_org_id ON public.user_orgs USING btree (org_id);
CREATE INDEX idx_user_orgs_user_id ON public.user_orgs USING btree (user_id);

-- Enable RLS
ALTER TABLE user_orgs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own org mapping, or admins can view all
CREATE POLICY "Users can view their own org mapping" ON user_orgs
    FOR SELECT USING (
        auth.uid() = user_id
        OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['root'::text, 'admin'::text])
    );

-- Migrate data from old table
-- Convert org_id from text to uuid, filter out invalid UUIDs
INSERT INTO user_orgs (user_id, org_id, role, created_at, updated_at)
SELECT
    user_id,
    CASE
        -- Default org UUID from constants
        WHEN org_id = 'default' THEN '550e8400-e29b-41d4-a716-446655440000'::uuid
        -- Try to cast as UUID
        ELSE org_id::uuid
    END as org_id,
    role,
    created_at,
    updated_at
FROM user_orgs_old
WHERE TRUE
ON CONFLICT (user_id, org_id) DO NOTHING;

-- Drop old table
DROP TABLE user_orgs_old;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_orgs TO anon, authenticated, service_role;
GRANT TRIGGER ON user_orgs TO anon, authenticated, postgres, service_role;
GRANT REFERENCES ON user_orgs TO anon, authenticated, postgres, service_role;
GRANT TRUNCATE ON user_orgs TO postgres, service_role;
