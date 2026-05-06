import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profileLoading: boolean;
  hasUsername: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, username?: string, referralCode?: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [hasUsername, setHasUsername] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const enterGuestMode = () => setIsGuest(true);
  const exitGuestMode = () => setIsGuest(false);

  const refreshProfile = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    const { data } = await supabase.from('profiles').select('username, is_admin').eq('id', u.id).single();
    setHasUsername(!!data?.username);
    setIsAdmin(!!data?.is_admin);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, is_admin')
          .eq('id', data.session.user.id)
          .single();
        setHasUsername(!!profile?.username);
        setIsAdmin(!!profile?.is_admin);
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setIsGuest(false);
        setProfileLoading(true);
        const meta = s.user.user_metadata ?? {};
        await supabase.rpc('ensure_profile');
        // Copy username + referral code from signup metadata if not yet set
        if (meta.username) {
          await supabase.from('profiles').update({ username: meta.username }).eq('id', s.user.id).is('username', null);
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, is_admin, referred_by')
          .eq('id', s.user.id)
          .single();
        // Process referral code from metadata if not already referred
        if (meta.referral_code && !profile?.referred_by) {
          const code = (meta.referral_code as string).toUpperCase();
          const { data: referrer } = await supabase.from('profiles').select('id').eq('referral_code', code).neq('id', s.user.id).single();
          if (referrer) {
            await supabase.from('profiles').update({ referred_by: referrer.id }).eq('id', s.user.id);
            await supabase.from('referrals').insert({ referrer_id: referrer.id, referred_id: s.user.id });
          }
        }
        setHasUsername(!!profile?.username || !!meta.username);
        setIsAdmin(!!profile?.is_admin);
        setProfileLoading(false);
      } else {
        setHasUsername(false);
        setIsAdmin(false);
        setProfileLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async (emailOrUsername: string, password: string): Promise<string | null> => {
    let email = emailOrUsername.trim();

    if (!email.includes('@')) {
      const { data: lookedUp } = await supabase.rpc('get_email_by_username', { p_username: email });
      if (!lookedUp) return 'Identifiants incorrects.';
      email = lookedUp as string;
    }

    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    await supabase.rpc('ensure_profile');
    const metaUsername = data.user?.user_metadata?.username as string | undefined;
    if (metaUsername) {
      await supabase
        .from('profiles')
        .update({ username: metaUsername })
        .eq('id', data.user.id)
        .is('username', null);
    }
    return null;
  };

  const signUp = async (email: string, password: string, username?: string, referralCode?: string): Promise<string | null> => {
    const meta: Record<string, string> = {};
    if (username) meta.username = username;
    if (referralCode) meta.referral_code = referralCode.toUpperCase();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: Object.keys(meta).length > 0 ? { data: meta } : undefined,
    });
    return error?.message ?? null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, profileLoading, hasUsername, isAdmin, isGuest, enterGuestMode, exitGuestMode, refreshProfile, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
