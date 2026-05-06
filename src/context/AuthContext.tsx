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
        const userId = data.session.user.id;
        // Race against a 5s timeout to prevent infinite loading when iOS resumes
        // with a stale network connection that hangs Supabase queries.
        await Promise.race([
          (async () => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, is_admin')
              .eq('id', userId)
              .single();
            setHasUsername(!!profile?.username);
            setIsAdmin(!!profile?.is_admin);
          })(),
          new Promise<void>((resolve) => setTimeout(resolve, 5000)),
        ]);
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
        const userId = s.user.id;
        await Promise.race([
          (async () => {
            await supabase.rpc('ensure_profile');
            if (meta.username) {
              await supabase.from('profiles').update({ username: meta.username }).eq('id', userId).is('username', null);
            }
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, is_admin, referred_by')
              .eq('id', userId)
              .single();
            if (meta.referral_code && !profile?.referred_by) {
              const code = (meta.referral_code as string).toUpperCase();
              const { data: referrer } = await supabase.from('profiles').select('id').eq('referral_code', code).neq('id', userId).single();
              if (referrer) {
                await supabase.from('profiles').update({ referred_by: referrer.id }).eq('id', userId);
                await supabase.from('referrals').insert({ referrer_id: referrer.id, referred_id: userId });
                const newUsername = profile?.username || (meta.username as string | undefined) || 'Un nouvel utilisateur';
                supabase.functions.invoke('send-push', {
                  body: {
                    receiver_id: referrer.id,
                    sender_name: '✦ Nouveau filleul !',
                    message_preview: `${newUsername} vient de rejoindre Pépite avec ton code de parrainage.`,
                    type: 'referral',
                  },
                });
              }
            }
            setHasUsername(!!profile?.username || !!meta.username);
            setIsAdmin(!!profile?.is_admin);
          })(),
          new Promise<void>((resolve) => setTimeout(resolve, 8000)),
        ]);
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
