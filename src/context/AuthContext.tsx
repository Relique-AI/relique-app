import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profileLoading: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  isRecovery: boolean;
  clearRecovery: () => void;
  handleRecovery: (accessToken: string, refreshToken: string) => Promise<void>;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, username?: string, referralCode?: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  signInWithApple: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const enterGuestMode = () => setIsGuest(true);
  const exitGuestMode = () => setIsGuest(false);
  const clearRecovery = () => setIsRecovery(false);

  const handleRecovery = async (accessToken: string, refreshToken: string) => {
    await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    setIsRecovery(true);
  };

  const refreshProfile = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    const { data } = await supabase.from('profiles').select('username, is_admin').eq('id', u.id).single();
    setIsAdmin(!!data?.is_admin);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        setLoading(false);
        // Requête profil en arrière-plan
        const userId = data.session.user.id;
        (async () => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, is_admin')
              .eq('id', userId)
              .single();
            setIsAdmin(!!profile?.is_admin);
          } catch {}
        })();
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSession(s);
        setUser(s?.user ?? null);
        setIsRecovery(true);
        return;
      }
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setIsGuest(false);
        const meta = s.user.user_metadata ?? {};
        const userId = s.user.id;
        // Mise à jour du profil en arrière-plan — ne bloque plus l'UI
        setProfileLoading(false);
        (async () => {
          try {
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

                // Auto-générer un pseudo pour les nouveaux comptes Google
                if (!profile?.username && !meta.username) {
                  const displayName = (meta.full_name || meta.name || meta.email || 'utilisateur') as string;
                  const base = displayName
                    .toLowerCase()
                    .normalize('NFD').replace(/[̀-ͯ]/g, '')
                    .replace(/[^a-z0-9]/g, '_')
                    .replace(/_+/g, '_')
                    .replace(/^_|_$/g, '')
                    .slice(0, 15) || 'utilisateur';
                  const suffix = Math.floor(Math.random() * 9000) + 1000;
                  await supabase.from('profiles').update({ username: `${base}_${suffix}` }).eq('id', userId).is('username', null);
                }

                if (meta.referral_code && !profile?.referred_by) {
                  const code = (meta.referral_code as string).toUpperCase();
                  const { data: referrer } = await supabase.from('profiles').select('id').eq('referral_code', code).neq('id', userId).single();
                  if (referrer) {
                    await supabase.from('profiles').update({ referred_by: referrer.id, referral_credits: 3 }).eq('id', userId);
                    await supabase.from('referrals').insert({ referrer_id: referrer.id, referred_id: userId });
                    const newUsername = profile?.username || (meta.username as string | undefined) || 'Un nouvel utilisateur';
                    supabase.functions.invoke('send-push', {
                      body: {
                        receiver_id: referrer.id,
                        sender_name: '✦ Nouveau filleul !',
                        message_preview: `${newUsername} vient de rejoindre Pépite avec ton code. Tu seras crédité de 3 achats à -50% dès son premier achat !`,
                        type: 'referral',
                      },
                    });
                  }
                }
                setIsAdmin(!!profile?.is_admin);
              })(),
              new Promise<void>((resolve) => setTimeout(resolve, 8000)),
            ]);
          } catch {}
        })();
      } else {
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
      options: {
        ...(Object.keys(meta).length > 0 ? { data: meta } : {}),
        emailRedirectTo: 'pepite://auth/callback',
      },
    });
    if (!error) {
      supabase.functions.invoke('send-welcome', { body: { email, username } });
    }
    return error?.message ?? null;
  };

  const signInWithGoogle = async (): Promise<string | null> => {
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signOut();
      const rawNonceBytes = new Uint8Array(16);
      crypto.getRandomValues(rawNonceBytes);
      const rawNonce = Array.from(rawNonceBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawNonce));
      const hashedNonce = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      const response = await GoogleSignin.signIn({ nonce: hashedNonce });
      if (response.type === 'cancelled') return null;
      const idToken = response.data?.idToken;
      if (!idToken) return 'Token Google indisponible.';
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken, nonce: rawNonce });
      return error?.message ?? null;
    } catch (e: any) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) return null;
      if (e.code === statusCodes.IN_PROGRESS) return null;
      return e.message ?? 'Erreur de connexion Google.';
    }
  };

  const signInWithApple = async (): Promise<string | null> => {
    try {
      const rawNonceBytes = new Uint8Array(16);
      crypto.getRandomValues(rawNonceBytes);
      const rawNonce = Array.from(rawNonceBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawNonce));
      const hashedNonce = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      if (!credential.identityToken) return 'Token Apple indisponible.';
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce,
      });
      return error?.message ?? null;
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') return null;
      return e.message ?? 'Erreur de connexion Apple.';
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, profileLoading, isAdmin, isGuest, isRecovery, clearRecovery, handleRecovery, enterGuestMode, exitGuestMode, refreshProfile, signIn, signUp, signInWithGoogle, signInWithApple, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
