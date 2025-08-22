import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

interface Organization {
  id: string;
  name: string;
  domain?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  organization: Organization | null;
  organizations: Organization[];
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string, organizationName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadOrganizations = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_user_organizations', {
        user_uuid: userId
      });

      if (error) throw error;
      
      setOrganizations(data || []);
      
      // Set first organization as default if none selected
      if (data && data.length > 0 && !organization) {
        setOrganization(data[0]);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer data loading to prevent deadlocks
          setTimeout(() => {
            loadProfile(session.user.id);
            loadOrganizations(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setOrganization(null);
          setOrganizations([]);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          loadProfile(session.user.id);
          loadOrganizations(session.user.id);
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string, organizationName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (error) throw error;

      // Create organization after successful signup
      if (data.user) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert([{ name: organizationName }])
          .select()
          .single();

        if (orgError) throw orgError;

        // Create membership
        const { error: membershipError } = await supabase
          .from('memberships')
          .insert([{
            user_id: data.user.id,
            organization_id: orgData.id,
            role: 'owner'
          }]);

        if (membershipError) throw membershipError;

        toast({
          title: "Account created successfully!",
          description: "Please check your email to verify your account.",
        });
      }

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
        
        // Force page reload for clean state
        window.location.href = '/';
      }

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out.",
      });
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const switchOrganization = async (organizationId: string) => {
    const org = organizations.find(o => o.id === organizationId);
    if (org) {
      setOrganization(org);
      toast({
        title: "Organization switched",
        description: `Switched to ${org.name}`,
      });
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    organization,
    organizations,
    loading,
    signUp,
    signIn,
    signOut,
    switchOrganization,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth() {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth';
    }
  }, [user, loading]);
  
  return { user, loading };
}