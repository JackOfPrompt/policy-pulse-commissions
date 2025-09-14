import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  sub_department: string | null;
  role: 'super_admin' | 'admin' | 'agent' | 'employee' | 'customer';
  org_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
  isInOrg: (orgId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        setProfile(data as Profile);
        return;
      }

      if (error) {
        console.warn('Profile not found, falling back to auth metadata:', error);
      }

      // Fallback to auth metadata so users can access the app even if profiles row is missing
      const { data: authData } = await supabase.auth.getUser();
      const meta = authData.user?.user_metadata || {};
      
      // Special handling for superadmin email
      const fallbackRole = authData.user?.email === 'superadmin@insurtech.com' ? 'super_admin' : 
                          ((meta.role as any) ?? 'customer') as Profile['role'];
      
      setProfile({
        id: userId,
        full_name: meta.full_name ?? null,
        email: authData.user?.email ?? null,
        department: null,
        sub_department: null,
        role: fallbackRole,
        org_id: meta.org_id ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const trackSession = async (userId: string, type: 'login' | 'logout') => {
    try {
      if (type === 'login') {
        await supabase.from('user_sessions').insert({
          user_id: userId,
          ip_address: 'unknown', // Could be enhanced with actual IP
          device: navigator.userAgent,
          session_token: session?.access_token || 'unknown'
        });
      } else {
        await supabase
          .from('user_sessions')
          .update({ logout_at: new Date().toISOString() })
          .eq('user_id', userId)
          .is('logout_at', null);
      }
    } catch (error) {
      console.error('Error tracking session:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetch to avoid blocking auth callback
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
          
          if (event === 'SIGNED_IN') {
            setTimeout(() => {
              trackSession(session.user.id, 'login');
            }, 0);
          }
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, metadata = {}) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: redirectUrl,
      }
    });
    return { error };
  };

  const signOut = async () => {
    if (user) {
      await trackSession(user.id, 'logout');
    }
    await supabase.auth.signOut();
  };

  const hasRole = (role: string) => {
    return profile?.role === role;
  };

  const isInOrg = (orgId: string) => {
    return profile?.org_id === orgId;
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole,
    isInOrg,
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