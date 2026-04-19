-- ── Questions Category Migration ──────────────────────────────────────────────
-- Migrates the questions table from the old single-level topic system
-- (accounting, valuation, dcf, lbo, other, brainteaser) to a two-level system:
--   question_type: behavioral | technical
--   topic: accounting | valuation | dcf | lbo | ma | restructuring | financial_markets | NULL (for behavioral)
-- Run this in the Supabase SQL editor.

-- ── Step 1: Make topic nullable (behavioral questions have no topic) ───────────
ALTER TABLE questions
  ALTER COLUMN topic DROP NOT NULL;

-- ── Step 2: Add question_type column ─────────────────────────────────────────
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS question_type text NOT NULL DEFAULT 'technical';

-- ── Step 3: Migrate old topic values to new ones ──────────────────────────────
-- "other" → "ma"  (the primary "other" question was a merger model walkthrough)
UPDATE questions
SET topic = 'ma'
WHERE topic = 'other';

-- "brainteaser" → "financial_markets"
UPDATE questions
SET topic = 'financial_markets'
WHERE topic = 'brainteaser';

-- ── Step 4: Drop the old topic check constraint (if it exists) ─────────────────
ALTER TABLE questions
  DROP CONSTRAINT IF EXISTS questions_topic_check;

-- ── Step 5: Add updated constraints ──────────────────────────────────────────
ALTER TABLE questions
  ADD CONSTRAINT questions_question_type_check
    CHECK (question_type IN ('behavioral', 'technical'));

ALTER TABLE questions
  ADD CONSTRAINT questions_topic_check
    CHECK (
      (question_type = 'behavioral' AND topic IS NULL)
      OR
      (question_type = 'technical' AND topic IN (
        'accounting', 'valuation', 'dcf', 'lbo',
        'ma', 'restructuring', 'financial_markets'
      ))
    );

-- ── Step 6: Add index for common filter queries ───────────────────────────────
CREATE INDEX IF NOT EXISTS questions_question_type_idx ON questions (question_type);
CREATE INDEX IF NOT EXISTS questions_topic_idx         ON questions (topic);
CREATE INDEX IF NOT EXISTS questions_difficulty_idx    ON questions (difficulty);

-- ── Step 7: Update RLS policies to use new column ────────────────────────────
-- Existing policies on (topic, difficulty) still work; nothing to change there.
-- If you previously had policies referencing 'other' or 'brainteaser' topic values,
-- update them here.

-- ── Verification ──────────────────────────────────────────────────────────────
-- After running, verify with:
-- SELECT question_type, topic, difficulty, COUNT(*) FROM questions GROUP BY 1,2,3 ORDER BY 1,2,3;
-- SELECT * FROM questions WHERE question_type = 'technical' AND topic IS NULL; -- should be 0 rows
-- SELECT * FROM questions WHERE question_type = 'behavioral' AND topic IS NOT NULL; -- should be 0 rows
