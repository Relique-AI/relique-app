import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, spacing } from '../theme';
import { AppTextInput } from '../components/AppTextInput';

type Tab = 'login' | 'signup' | 'forgot';

export function AuthScreen() {
  const { t } = useTranslation();
  const { signIn, signUp, signInWithGoogle, signInWithApple, enterGuestMode } = useAuth();
  const [tab, setTab] = useState<Tab>('login');

  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.5, duration: 2000, useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 2400, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [username, setUsername] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const usernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkUsername = useCallback((value: string) => {
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
    const trimmed = value.trim();
    if (trimmed.length < 3 || !/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    usernameTimerRef.current = setTimeout(async () => {
      const { supabase: sb } = await import('../services/supabase');
      const { data } = await sb.from('profiles').select('id').eq('username', trimmed).maybeSingle();
      setUsernameStatus(data ? 'taken' : 'available');
    }, 500);
  }, []);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (tab === 'signup') checkUsername(value);
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (tab === 'forgot') {
      if (!email.trim()) { setError(t('auth.errors.emailRequired')); return; }
      setLoading(true);
      const { error: err } = await import('../services/supabase').then(m =>
        m.supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: 'pepite://auth/callback' })
      );
      setLoading(false);
      if (err) setError(translateError(err.message, t));
      else setSuccess(t('auth.resetLinkSent'));
      return;
    }

    if (!email.trim() || !password) {
      setError(t('auth.errors.fillAllFields'));
      return;
    }

    if (tab === 'signup') {
      if (password !== confirm) {
        setError(t('auth.errors.passwordMismatch'));
        return;
      }
      if (password.length < 6) {
        setError(t('auth.errors.passwordTooShort'));
        return;
      }
      const trimmedUsername = username.trim();
      if (trimmedUsername.length < 3) {
        setError(t('auth.errors.usernameTooShort'));
        return;
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(trimmedUsername)) {
        setError(t('auth.errors.usernamePattern'));
        return;
      }
    }

    setLoading(true);
    let referrerUsername: string | null = null;

    if (tab === 'signup') {
      const { supabase: sb } = await import('../services/supabase');
      const { data: existing } = await sb
        .from('profiles')
        .select('id')
        .eq('username', username.trim())
        .maybeSingle();
      if (existing) {
        setError(t('auth.errors.usernameTaken'));
        setLoading(false);
        setUsernameStatus('taken');
        return;
      }
    }
    if (tab === 'signup' && referralCode.trim()) {
      const { supabase: sb } = await import('../services/supabase');
      const { data: referrer } = await sb
        .from('profiles')
        .select('username')
        .eq('referral_code', referralCode.trim().toUpperCase())
        .single();
      referrerUsername = referrer?.username ?? null;
    }
    const errMsg =
      tab === 'login'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, username.trim(), referralCode.trim() || undefined);
    setLoading(false);

    if (errMsg) {
      setError(translateError(errMsg, t));
    } else if (tab === 'signup') {
      const referralMsg = referrerUsername
        ? t('auth.referralSuccess', { referrer: referrerUsername })
        : '';
      setSuccess(t('auth.welcome', { referralMsg }));
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.header}>
            <Animated.View style={[styles.logoWrap, { transform: [{ translateY: floatAnim }] }]}>
              <Animated.View style={[styles.logoGlow, { opacity: glowAnim }]} />
              <View style={styles.logoGem}>
                <Text style={styles.logoGemText}>✦</Text>
              </View>
            </Animated.View>
            <Text style={styles.brand}>{t('home.brand')}</Text>
            <Text style={styles.subtitle}>{t('home.tagline')}</Text>
          </View>

          {/* Tabs */}
          {tab !== 'forgot' && (
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tabItem, tab === 'login' && styles.tabItemActive]}
                onPress={() => { setTab('login'); setUsername(''); setError(null); setSuccess(null); }}
              >
                <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>{t('auth.tabs.login')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabItem, tab === 'signup' && styles.tabItemActive]}
                onPress={() => { setTab('signup'); setError(null); setSuccess(null); setUsernameStatus('idle'); }}
              >
                <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>{t('auth.tabs.signup')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Titre mot de passe oublié */}
          {tab === 'forgot' && (
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.forgotTitle}>{t('auth.forgot.title')}</Text>
              <Text style={styles.forgotSub}>{t('auth.forgot.subtitle')}</Text>
            </View>
          )}

          {/* Formulaire */}
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{tab === 'login' ? t('auth.labels.emailOrUsername') : t('auth.labels.email')}</Text>
              <AppTextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={tab === 'login' ? t('auth.placeholders.emailOrUsername') : t('auth.placeholders.email')}
                keyboardType={tab === 'login' ? 'default' : 'email-address'}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                autoComplete="email"
              />
            </View>

            {tab === 'signup' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('auth.labels.username')}</Text>
                <AppTextInput
                  style={[styles.input, usernameStatus === 'taken' && styles.inputError, usernameStatus === 'available' && styles.inputOk]}
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder={t('auth.placeholders.username')}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={30}
                />
                {usernameStatus === 'checking' && <Text style={styles.fieldHint}>{t('auth.username.checking')}</Text>}
                {usernameStatus === 'available' && <Text style={[styles.fieldHint, { color: colors.success }]}>{t('auth.username.available')}</Text>}
                {usernameStatus === 'taken' && <Text style={[styles.fieldHint, { color: colors.danger }]}>{t('auth.username.taken')}</Text>}
                {usernameStatus === 'idle' && <Text style={styles.fieldHint}>{t('auth.username.rules')}</Text>}
              </View>
            )}

            {tab !== 'forgot' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('auth.labels.password')}</Text>
                <AppTextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  textContentType={tab === 'signup' ? 'newPassword' : 'password'}
                  autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                />
                {tab === 'login' && (
                  <TouchableOpacity onPress={() => { setTab('forgot'); setError(null); setSuccess(null); }}>
                    <Text style={styles.forgotLink}>{t('auth.forgotPasswordLink')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {tab === 'signup' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('auth.labels.confirmPassword')}</Text>
                <AppTextInput
                  style={styles.input}
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="••••••••"
                  secureTextEntry
                  textContentType="newPassword"
                  autoComplete="new-password"
                />
              </View>
            )}

            {tab === 'signup' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('auth.labels.referralCode')}</Text>
                <AppTextInput
                  style={styles.input}
                  value={referralCode}
                  onChangeText={setReferralCode}
                  placeholder={t('auth.placeholders.referralCode')}
  
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={8}
                />
              </View>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}
            {success && <Text style={styles.successText}>{success}</Text>}

            <TouchableOpacity
              style={[styles.cta, loading && styles.ctaDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.ctaText}>
                  {tab === 'login' ? t('auth.submit.login') : tab === 'signup' ? t('auth.submit.signup') : t('auth.submit.forgot')}
                </Text>
              )}
            </TouchableOpacity>

            {tab === 'forgot' && (
              <TouchableOpacity onPress={() => { setTab('login'); setError(null); setSuccess(null); }} style={{ alignItems: 'center', marginTop: 8 }}>
                <Text style={styles.forgotLink}>{t('auth.backToLogin')}</Text>
              </TouchableOpacity>
            )}

          </View>
          {tab !== 'forgot' && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('auth.or')}</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[styles.googleBtn, loading && styles.ctaDisabled]}
                onPress={async () => {
                  setError(null);
                  setLoading(true);
                  const err = await signInWithGoogle();
                  setLoading(false);
                  if (err) setError(err);
                }}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleText}>{t('auth.continueWithGoogle')}</Text>
              </TouchableOpacity>

              {Platform.OS === 'ios' && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                  cornerRadius={50}
                  style={styles.appleBtn}
                  onPress={async () => {
                    setError(null);
                    setLoading(true);
                    const err = await signInWithApple();
                    setLoading(false);
                    if (err) setError(err);
                  }}
                />
              )}

              <TouchableOpacity style={styles.guestBtn} onPress={enterGuestMode} activeOpacity={0.7}>
                <Text style={styles.guestText}>{t('auth.guestLink')}</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function translateError(msg: string, t: TFunction): string {
  if (msg.includes('Invalid login credentials')) return t('auth.errors.invalidCredentials');
  if (msg.includes('Email not confirmed')) return t('auth.errors.emailNotConfirmed');
  if (msg.includes('User already registered')) return t('auth.errors.userExists');
  if (msg.includes('Password should be')) return t('auth.errors.passwordTooShortServer');
  return msg;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.section,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoWrap: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  logoGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary,
  },
  logoGem: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGemText: {
    fontSize: 26,
    color: colors.primary,
  },
  brand: {
    fontFamily: fonts.serif,
    fontSize: 52,
    color: colors.primary,
    letterSpacing: -1,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: fonts.serifItalic,
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabItemActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.background,
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.chipBackground,
  },
  inputError: { borderColor: colors.danger },
  inputOk: { borderColor: colors.success },
  guestBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  guestText: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.chipBackground },
  dividerText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 50,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.chipBackground,
  },
  googleIcon: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.textPrimary },
  googleText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary },
  appleBtn: { width: '100%', height: 52 },
  fieldHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.danger,
    textAlign: 'center',
  },
  successText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.success,
    textAlign: 'center',
    lineHeight: 20,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    color: colors.background,
  },
  forgotTitle: {
    fontFamily: fonts.serif,
    fontSize: 26,
    color: colors.primary,
    marginBottom: 8,
  },
  forgotSub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  forgotLink: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.primary,
    marginTop: 4,
  },
});
