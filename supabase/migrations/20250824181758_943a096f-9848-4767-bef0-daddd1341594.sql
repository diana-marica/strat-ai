-- Clean up duplicate draft audits, keeping only the most recent one per user
WITH ranked_audits AS (
  SELECT id, user_id,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rn
  FROM audits 
  WHERE status = 'draft'
),
audits_to_delete AS (
  SELECT id 
  FROM ranked_audits 
  WHERE rn > 1
)
DELETE FROM audits 
WHERE id IN (SELECT id FROM audits_to_delete);

-- Add index to prevent future performance issues
CREATE INDEX IF NOT EXISTS idx_audits_user_status ON audits(user_id, status);

-- Add unique constraint to prevent multiple active drafts per user
ALTER TABLE audits ADD CONSTRAINT unique_user_draft 
  EXCLUDE (user_id WITH =) 
  WHERE (status = 'draft');