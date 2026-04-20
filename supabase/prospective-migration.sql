-- Run this in your Supabase SQL Editor.
-- Renames the 'researching' status to 'prospective' in the firms table.

-- 1. Update any existing rows that still have the old value
UPDATE public.firms SET status = 'prospective' WHERE status = 'researching';

-- 2. Drop the old check constraint (name may vary — try both)
ALTER TABLE public.firms DROP CONSTRAINT IF EXISTS firms_status_check;
ALTER TABLE public.firms DROP CONSTRAINT IF EXISTS firms_status_check1;

-- 3. Re-create the constraint with the correct values
ALTER TABLE public.firms
  ADD CONSTRAINT firms_status_check
  CHECK (status IN ('prospective', 'applied', 'interview', 'offer', 'rejected'));
