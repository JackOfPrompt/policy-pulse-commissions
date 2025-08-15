import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
// Remove bcrypt as it doesn't work reliably in browsers

interface User {
  id: string;
  email: string;
  created_at: string;
}
interface Profile {
  user_id: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  role: 'system_admin' | 'tenant_admin' | 'tenant_employee' | 'tenant_agent' | 'customer';
  avatar_url: string | null;
  tenant_id: string | null;
  must_change_password: boolean;
  password_changed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  createUser: (userData: any) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  createUser: async () => ({ error: null }),
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for stored user session
    const storedUser = localStorage.getItem('auth_user');
    const storedProfile = localStorage.getItem('auth_profile');
    
    if (storedUser && storedProfile) {
      setUser(JSON.parse(storedUser));
      setProfile(JSON.parse(storedProfile));
    }
    
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting login attempt for:', email);
      
      // Check credentials in database
      const { data: credentials, error: credError } = await supabase
        .from('user_credentials')
        .select('*')
        .eq('email', email)
        .eq('is_active', true);

      console.log('📋 Credentials query result:', { credentials, credError });

      if (credError) {
        console.log('❌ Database error:', credError);
        return { error: { message: 'Database error: ' + credError.message } };
      }

      if (!credentials || credentials.length === 0) {
        console.log('❌ No credentials found');
        return { error: { message: 'Invalid credentials - user not found' } };
      }

      const credential = credentials[0];
      console.log('🔍 Found credential:', credential);

      // For development, check against test credentials
      const testCredentials = {
        'admin@system.com': 'admin123',
        'tenant@admin.com': 'tenant123', 
        'employee@company.com': 'employee123',
        'agent@insurance.com': 'agent123',
        'customer@email.com': 'customer123'
      };
      
      const isValidPassword = testCredentials[email as keyof typeof testCredentials] === password;
      console.log('✅ Password verification result:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('❌ Password verification failed');
        return { error: { message: 'Invalid credentials - wrong password' } };
      }

      console.log('👤 Fetching user profile...');
      // Get user profile using the credentials ID as user_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', credential.id);

      console.log('📄 Profile query result:', { profileData, profileError });

      if (profileError) {
        console.log('❌ Profile database error:', profileError);
        return { error: { message: 'Profile error: ' + profileError.message } };
      }

      if (!profileData || profileData.length === 0) {
        console.log('❌ Profile not found');
        return { error: { message: 'Profile not found' } };
      }

      const profile = profileData[0];

      // Create user object
      const user: User = {
        id: credential.id,
        email: credential.email,
        created_at: credential.created_at,
      };

      console.log('✅ Login successful, setting user state');
      // Store in state and localStorage
      setUser(user);
      setProfile(profile);
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_profile', JSON.stringify(profile));

      return { error: null };
    } catch (error: any) {
      console.log('💥 Login error:', error);
      return { error: { message: error.message } };
    }
  };

  const signOut = async () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_profile');
    return { error: null };
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) return { error: { message: 'Not authenticated' } };
    
    try {
      // For development, just update a simple hash
      const { error } = await supabase
        .from('user_credentials')
        .update({ password_hash: newPassword }) // Simplified for development
        .eq('id', user.id);

      if (!error && profile) {
        await supabase
          .from('profiles')
          .update({ 
            must_change_password: false, 
            password_changed_at: new Date().toISOString()
          })
          .eq('email', user.email);
      }
      
      return { error };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  };

  const createUser = async (userData: any) => {
    try {
      // For development, use simple password storage
      const hashedPassword = userData.password; // Simplified
      
      // Insert credentials
      const { data: credData, error: credError } = await supabase
        .from('user_credentials')
        .insert({
          email: userData.email,
          password_hash: hashedPassword
        })
        .select()
        .single();
        
      if (credError) return { error: credError };
      
      // Insert profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: credData.id,
          email: userData.email,
          phone: userData.phone,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          tenant_id: userData.tenant_id,
          must_change_password: true
        });
      
      return { error: profileError };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    updatePassword,
    createUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};