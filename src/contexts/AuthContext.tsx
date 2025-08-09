import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  user_type: 'Employee' | 'Agent' | 'Customer' | 'Admin';
  employee_role?: 'Admin' | 'Sales' | 'Ops' | 'Branch Manager' | 'Finance';
  agent_type?: 'MISP' | 'POSP';
  branch_name?: string;
  is_active: boolean;
  kyc_status: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, userType: string, additionalData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile when logged in
          setTimeout(async () => {
            await fetchUserProfile(session.user.id);
          }, 0);
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
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Temporary bypass for development - grant admin access to specific test users
      const adminUsers = [
        '11111111-1111-1111-1111-111111111111', // admin@test.com
        '22222222-2222-2222-2222-222222222222', // employee@test.com
        '33333333-3333-3333-3333-333333333333'  // manager@test.com
      ];
      
      if (adminUsers.includes(userId)) {
        // Directly fetch from profiles table for test users
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (error) {
          console.error('Error fetching profile directly:', error);
          return;
        }
        
        // Override user_type for test users to bypass constraints
        const profileData: UserProfile = {
          id: data.id,
          email: data.email,
          phone: data.phone,
          full_name: data.full_name,
          user_type: userId === '11111111-1111-1111-1111-111111111111' ? 'Admin' : 'Employee',
          employee_role: userId === '11111111-1111-1111-1111-111111111111' ? 'Admin' : 
                        userId === '33333333-3333-3333-3333-333333333333' ? 'Branch Manager' : 'Sales',
          agent_type: null,
          branch_name: null,
          is_active: true,
          kyc_status: data.kyc_status
        };
        
        setProfile(profileData);
        return;
      }

      const { data, error } = await supabase
        .rpc('get_user_profile', { user_id: userId });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setProfile(data[0] as UserProfile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, userType: string, additionalData = {}) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            user_type: userType,
            ...additionalData
          }
        }
      });
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user?.id);

      if (!error && profile) {
        setProfile({ ...profile, ...updates });
      }
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};