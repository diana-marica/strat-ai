-- Create audits table to store audit sessions
CREATE TABLE public.audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID,
  title TEXT NOT NULL DEFAULT 'AI Readiness Audit',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'failed')),
  responses JSONB NOT NULL DEFAULT '{}',
  report_content TEXT,
  report_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own audits" 
ON public.audits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own audits" 
ON public.audits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audits" 
ON public.audits 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audits" 
ON public.audits 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_audits_updated_at
BEFORE UPDATE ON public.audits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for audit reports
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audit-reports', 'audit-reports', false);

-- Create policies for audit report storage
CREATE POLICY "Users can view their own audit reports" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'audit-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own audit reports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'audit-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own audit reports" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'audit-reports' AND auth.uid()::text = (storage.foldername(name))[1]);