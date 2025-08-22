-- Fix security definer functions by setting search_path
CREATE OR REPLACE FUNCTION public.get_user_organizations(user_uuid UUID)
RETURNS SETOF public.organizations
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT o.*
  FROM public.organizations o
  JOIN public.memberships m ON o.id = m.organization_id
  WHERE m.user_id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.user_has_org_access(user_uuid UUID, org_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships
    WHERE user_id = user_uuid 
    AND organization_id = org_uuid
  );
$$;