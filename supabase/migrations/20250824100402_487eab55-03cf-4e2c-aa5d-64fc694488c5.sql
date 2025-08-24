-- Clean up any audits stuck in generating status and reset them to draft
UPDATE audits 
SET status = 'draft', 
    updated_at = now()
WHERE status = 'generating';