-- Add is_rented column to properties table
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS is_rented BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN properties.is_rented IS 'Marks a rental property as currently rented out. Displayed as a "Rented" badge on the public site.';
