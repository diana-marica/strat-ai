-- Fix RLS policies and add missing ones

-- Fix the organizations UPDATE policy (bug: referencing memberships.id instead of organizations.id)
DROP POLICY IF EXISTS "Users can update organizations they own" ON public.organizations;

CREATE POLICY "Users can update organizations they own" 
ON public.organizations 
FOR UPDATE 
USING (EXISTS (
  SELECT 1
  FROM memberships
  WHERE memberships.user_id = auth.uid() 
    AND memberships.organization_id = organizations.id 
    AND memberships.role IN ('owner', 'admin')
));

-- Add missing DELETE policies for all tables
CREATE POLICY "Users can delete organizations they own" 
ON public.organizations 
FOR DELETE 
USING (EXISTS (
  SELECT 1
  FROM memberships
  WHERE memberships.user_id = auth.uid() 
    AND memberships.organization_id = organizations.id 
    AND memberships.role = 'owner'
));

CREATE POLICY "Users can delete their own memberships" 
ON public.memberships 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Organization owners can delete memberships" 
ON public.memberships 
FOR DELETE 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1
    FROM memberships owner_check
    WHERE owner_check.user_id = auth.uid() 
      AND owner_check.organization_id = memberships.organization_id 
      AND owner_check.role = 'owner'
  )
);

-- Add UPDATE policy for memberships (missing)
CREATE POLICY "Organization owners can update memberships" 
ON public.memberships 
FOR UPDATE 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1
    FROM memberships owner_check
    WHERE owner_check.user_id = auth.uid() 
      AND owner_check.organization_id = memberships.organization_id 
      AND owner_check.role = 'owner'
  )
);

-- Fix organization creation by temporarily allowing authenticated users to create organizations
-- We'll handle the membership creation separately in the application logic
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;

CREATE POLICY "Authenticated users can create organizations" 
ON public.organizations 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);