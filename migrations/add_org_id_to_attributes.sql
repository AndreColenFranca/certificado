-- Migration: Add org_id to all 9 attribute tables (REQUIRED - NO DEFAULTS!)
-- Date: 2026-08-17
-- Description: Add org_id column to ALL attribute tables
-- org_id is MANDATORY - no defaults allowed after migration!

-- 1. collections (adicionar org_id)
ALTER TABLE collections ADD COLUMN org_id uuid;
UPDATE collections SET org_id = '550e8400-e29b-41d4-a716-446655440000' WHERE org_id IS NULL;
ALTER TABLE collections ALTER COLUMN org_id SET NOT NULL;
CREATE INDEX idx_collections_org_id ON collections(org_id);
ALTER TABLE collections DROP CONSTRAINT IF EXISTS collections_name_key;
ALTER TABLE collections ADD CONSTRAINT collections_org_id_name_key UNIQUE(org_id, name);

-- 2. manufacturers (adicionar org_id)
ALTER TABLE manufacturers ADD COLUMN org_id uuid;
UPDATE manufacturers SET org_id = '550e8400-e29b-41d4-a716-446655440000' WHERE org_id IS NULL;
ALTER TABLE manufacturers ALTER COLUMN org_id SET NOT NULL;
CREATE INDEX idx_manufacturers_org_id ON manufacturers(org_id);
ALTER TABLE manufacturers DROP CONSTRAINT IF EXISTS manufacturers_name_key;
ALTER TABLE manufacturers ADD CONSTRAINT manufacturers_org_id_name_key UNIQUE(org_id, name);

-- 3. metal_purities (adicionar org_id)
ALTER TABLE metal_purities ADD COLUMN org_id uuid;
UPDATE metal_purities SET org_id = '550e8400-e29b-41d4-a716-446655440000' WHERE org_id IS NULL;
ALTER TABLE metal_purities ALTER COLUMN org_id SET NOT NULL;
CREATE INDEX idx_metal_purities_org_id ON metal_purities(org_id);
ALTER TABLE metal_purities DROP CONSTRAINT IF EXISTS metal_purities_name_key;
ALTER TABLE metal_purities ADD CONSTRAINT metal_purities_org_id_name_key UNIQUE(org_id, name);

-- 4. metal_colors (adicionar org_id)
ALTER TABLE metal_colors ADD COLUMN org_id uuid;
UPDATE metal_colors SET org_id = '550e8400-e29b-41d4-a716-446655440000' WHERE org_id IS NULL;
ALTER TABLE metal_colors ALTER COLUMN org_id SET NOT NULL;
CREATE INDEX idx_metal_colors_org_id ON metal_colors(org_id);
ALTER TABLE metal_colors DROP CONSTRAINT IF EXISTS metal_colors_name_key;
ALTER TABLE metal_colors ADD CONSTRAINT metal_colors_org_id_name_key UNIQUE(org_id, name);

-- 5. finishes (adicionar org_id)
ALTER TABLE finishes ADD COLUMN org_id uuid;
UPDATE finishes SET org_id = '550e8400-e29b-41d4-a716-446655440000' WHERE org_id IS NULL;
ALTER TABLE finishes ALTER COLUMN org_id SET NOT NULL;
CREATE INDEX idx_finishes_org_id ON finishes(org_id);
ALTER TABLE finishes DROP CONSTRAINT IF EXISTS finishes_name_key;
ALTER TABLE finishes ADD CONSTRAINT finishes_org_id_name_key UNIQUE(org_id, name);

-- 6. stone_types (adicionar org_id)
ALTER TABLE stone_types ADD COLUMN org_id uuid;
UPDATE stone_types SET org_id = '550e8400-e29b-41d4-a716-446655440000' WHERE org_id IS NULL;
ALTER TABLE stone_types ALTER COLUMN org_id SET NOT NULL;
CREATE INDEX idx_stone_types_org_id ON stone_types(org_id);
ALTER TABLE stone_types DROP CONSTRAINT IF EXISTS stone_types_name_key;
ALTER TABLE stone_types ADD CONSTRAINT stone_types_org_id_name_key UNIQUE(org_id, name);

-- 7. setting_types (adicionar org_id)
ALTER TABLE setting_types ADD COLUMN org_id uuid;
UPDATE setting_types SET org_id = '550e8400-e29b-41d4-a716-446655440000' WHERE org_id IS NULL;
ALTER TABLE setting_types ALTER COLUMN org_id SET NOT NULL;
CREATE INDEX idx_setting_types_org_id ON setting_types(org_id);
ALTER TABLE setting_types DROP CONSTRAINT IF EXISTS setting_types_name_key;
ALTER TABLE setting_types ADD CONSTRAINT setting_types_org_id_name_key UNIQUE(org_id, name);

-- 8. cut_shapes (adicionar org_id)
ALTER TABLE cut_shapes ADD COLUMN org_id uuid;
UPDATE cut_shapes SET org_id = '550e8400-e29b-41d4-a716-446655440000' WHERE org_id IS NULL;
ALTER TABLE cut_shapes ALTER COLUMN org_id SET NOT NULL;
CREATE INDEX idx_cut_shapes_org_id ON cut_shapes(org_id);
ALTER TABLE cut_shapes DROP CONSTRAINT IF EXISTS cut_shapes_name_key;
ALTER TABLE cut_shapes ADD CONSTRAINT cut_shapes_org_id_name_key UNIQUE(org_id, name);

-- 9. color_grades (adicionar org_id)
ALTER TABLE color_grades ADD COLUMN org_id uuid;
UPDATE color_grades SET org_id = '550e8400-e29b-41d4-a716-446655440000' WHERE org_id IS NULL;
ALTER TABLE color_grades ALTER COLUMN org_id SET NOT NULL;
CREATE INDEX idx_color_grades_org_id ON color_grades(org_id);
ALTER TABLE color_grades DROP CONSTRAINT IF EXISTS color_grades_name_key;
ALTER TABLE color_grades ADD CONSTRAINT color_grades_org_id_name_key UNIQUE(org_id, name);
