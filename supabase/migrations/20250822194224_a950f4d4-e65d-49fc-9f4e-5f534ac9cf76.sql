-- Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- Create memberships table for organization access
CREATE TABLE public.memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

-- Security definer function to get user's organizations
CREATE OR REPLACE FUNCTION public.get_user_organizations(user_uuid UUID)
RETURNS SETOF public.organizations
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT o.*
  FROM public.organizations o
  JOIN public.memberships m ON o.id = m.organization_id
  WHERE m.user_id = user_uuid;
$$;

-- Security definer function to check organization membership
CREATE OR REPLACE FUNCTION public.user_has_org_access(user_uuid UUID, org_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships
    WHERE user_id = user_uuid 
    AND organization_id = org_uuid
  );
$$;

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they belong to" 
ON public.organizations 
FOR SELECT 
USING (public.user_has_org_access(auth.uid(), id));

CREATE POLICY "Users can update organizations they own" 
ON public.organizations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND organization_id = id 
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Authenticated users can create organizations" 
ON public.organizations 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for memberships
CREATE POLICY "Users can view memberships for their organizations" 
ON public.memberships 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  public.user_has_org_access(auth.uid(), organization_id)
);

CREATE POLICY "Users can insert memberships for organizations they own" 
ON public.memberships 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND organization_id = NEW.organization_id 
    AND role IN ('owner', 'admin')
  )
);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$;

-- Trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for timestamp updates
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();